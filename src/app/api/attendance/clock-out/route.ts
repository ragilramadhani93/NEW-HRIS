import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false })
}

// Haversine formula - calculate distance between two GPS points in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// POST - Clock out
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, location, settings } = body

    const today = getTodayDate()
    const currentTime = getCurrentTime()

    // Get employee with outlet info
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { outlet: true, shift: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if attendance record exists for today
    const attendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      include: { outlet: true },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'No clock in record found for today' }, { status: 404 })
    }

    if (attendance.clockOut) {
      return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 })
    }

    // GPS validation
    let locationStr: string | null = null

    if (location && location.lat !== undefined && location.lng !== undefined) {
      locationStr = `${location.lat},${location.lng}`

      // Validate against the outlet used for clock-in, or the employee's assigned outlet
      const checkOutlet = attendance.outlet || employee?.outlet
      if (checkOutlet) {
        const distance = haversineDistance(
          location.lat, location.lng,
          checkOutlet.latitude, checkOutlet.longitude
        )

        if (distance > checkOutlet.radius) {
          return NextResponse.json({
            error: `You are ${Math.round(distance)}m away from ${checkOutlet.name}. Maximum allowed: ${checkOutlet.radius}m.`,
            distance: Math.round(distance),
            outlet: checkOutlet.name,
            radius: checkOutlet.radius,
          }, { status: 403 })
        }
      }
    }

    // Determine if early leave using outlet schedule or global settings
    let workEndTime = settings?.workEndTime || '17:00'

    if (employee.shift) {
      workEndTime = employee.shift.endTime
    } else {
      const outletForSchedule = attendance.outlet || employee?.outlet
      if (outletForSchedule) {
        workEndTime = outletForSchedule.workEndTime
      }
    }

    const [workHour, workMinute] = workEndTime.split(':').map(Number)
    const [currentHour, currentMinute] = currentTime.split(':').map(Number).slice(0, 2)

    const workMinutes = workHour * 60 + workMinute
    const currentMinutes = currentHour * 60 + currentMinute

    const status = currentMinutes < workMinutes - 15 ? 'EARLY_LEAVE' : attendance.status

    const updatedAttendance = await db.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: currentTime,
        clockOutLocation: locationStr,
        status,
      },
      include: {
        employee: {
          include: { department: true, outlet: true },
        },
        outlet: true,
      },
    })

    return NextResponse.json(updatedAttendance)
  } catch (error) {
    console.error('Error clocking out:', error)
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 })
  }
}
