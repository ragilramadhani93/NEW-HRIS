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
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// POST - Clock in with face recognition + GPS validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, location, settings } = body

    const today = getTodayDate()
    const currentTime = getCurrentTime()

    // Check if employee exists, include outlet
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { outlet: true, shift: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Check if already clocked in today
    const existingAttendance = await db.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    })

    if (existingAttendance && existingAttendance.clockIn) {
      return NextResponse.json({ error: 'Already clocked in today' }, { status: 400 })
    }

    // GPS validation - check if employee is near their assigned outlet
    let matchedOutletId: string | null = null
    let locationStr: string | null = null

    if (location && location.lat !== undefined && location.lng !== undefined) {
      locationStr = `${location.lat},${location.lng}`

      if (employee.outletId && employee.outlet) {
        // Employee has assigned outlet - validate against it
        const distance = haversineDistance(
          location.lat, location.lng,
          employee.outlet.latitude, employee.outlet.longitude
        )

        if (distance > employee.outlet.radius) {
          return NextResponse.json({
            error: `You are ${Math.round(distance)}m away from ${employee.outlet.name}. Maximum allowed: ${employee.outlet.radius}m.`,
            distance: Math.round(distance),
            outlet: employee.outlet.name,
            radius: employee.outlet.radius,
          }, { status: 403 })
        }

        matchedOutletId = employee.outletId
      } else {
        // No assigned outlet - find nearest active outlet in range
        const outlets = await db.outlet.findMany({ where: { isActive: true } })
        let nearestOutlet: { id: string; name: string; distance: number } | null = null

        for (const outlet of outlets) {
          const distance = haversineDistance(
            location.lat, location.lng,
            outlet.latitude, outlet.longitude
          )
          if (distance <= outlet.radius) {
            if (!nearestOutlet || distance < nearestOutlet.distance) {
              nearestOutlet = { id: outlet.id, name: outlet.name, distance }
            }
          }
        }

        if (nearestOutlet) {
          matchedOutletId = nearestOutlet.id
        }
        // If no outlet found, allow clock-in without outlet (backward compatible)
      }
    }

    // Determine status based on work start time from outlet or global settings
    let workStartTime = settings?.workStartTime || '09:00'
    const lateThreshold = settings?.lateThreshold || 15

    if (employee.shift) {
      workStartTime = employee.shift.startTime
    } else if (matchedOutletId) {
      const outlet = await db.outlet.findUnique({ where: { id: matchedOutletId } })
      if (outlet) {
        workStartTime = outlet.workStartTime
      }
    }

    const [workHour, workMinute] = workStartTime.split(':').map(Number)
    const [currentHour, currentMinute] = currentTime.split(':').map(Number).slice(0, 2)

    const workMinutes = workHour * 60 + workMinute
    const currentMinutes = currentHour * 60 + currentMinute

    const status = currentMinutes > workMinutes + lateThreshold ? 'LATE' : 'PRESENT'

    const attendance = await db.attendance.create({
      data: {
        employeeId,
        outletId: matchedOutletId,
        date: today,
        clockIn: currentTime,
        clockInLocation: locationStr,
        status,
        notes: null,
      },
      include: {
        employee: {
          include: { department: true, outlet: true },
        },
        outlet: true,
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error clocking in:', error)
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 })
  }
}
