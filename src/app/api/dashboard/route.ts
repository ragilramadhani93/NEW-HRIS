import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getTodayDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

// GET - Dashboard statistics
export async function GET() {
  try {
    const today = getTodayDate()

    // Total employees (active)
    const totalEmployees = await db.employee.count({
      where: { isActive: true },
    })

    // Today's attendance
    const todayAttendance = await db.attendance.findMany({
      where: { date: today },
      include: {
        employee: { include: { department: true } },
      },
    })

    const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT').length
    const lateToday = todayAttendance.filter((a) => a.status === 'LATE').length
    const absentToday = totalEmployees - todayAttendance.length

    // Recent attendance (last 10)
    const recentAttendance = await db.attendance.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { include: { department: true } },
      },
    })

    // Weekly data (last 7 days)
    const weeklyData: { date: string; present: number; late: number; absent: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = getDateDaysAgo(i)
      const dayAttendance = await db.attendance.findMany({
        where: { date },
      })
      weeklyData.push({
        date,
        present: dayAttendance.filter((a) => a.status === 'PRESENT').length,
        late: dayAttendance.filter((a) => a.status === 'LATE').length,
        absent: totalEmployees - dayAttendance.length,
      })
    }

    // Department breakdown
    const departments = await db.department.findMany({
      include: {
        _count: { select: { employees: true } },
      },
    })

    const departmentBreakdown = departments.map((d) => ({
      name: d.name,
      count: d._count.employees,
    }))

    return NextResponse.json({
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      recentAttendance,
      weeklyData,
      departmentBreakdown,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
