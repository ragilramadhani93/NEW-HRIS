import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List attendance with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}

    if (date) {
      where.date = date
    } else if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}
