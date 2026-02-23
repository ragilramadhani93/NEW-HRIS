import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// GET - Get today's attendance for an employee or all
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const today = getTodayDate()

    if (employeeId) {
      const attendance = await db.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: today,
          },
        },
        include: {
          employee: {
            include: { department: true },
          },
        },
      })
      return NextResponse.json(attendance)
    }

    // Get all today's attendance
    const attendance = await db.attendance.findMany({
      where: { date: today },
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { clockIn: 'asc' },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching today attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch today attendance' }, { status: 500 })
  }
}
