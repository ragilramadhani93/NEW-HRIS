import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get attendance report
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const departmentId = searchParams.get('departmentId')
    const outletId = searchParams.get('outletId')

    const where: Record<string, any> = {}

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    if (departmentId && departmentId !== 'all') {
      where.employee = { ...where.employee, departmentId }
    }

    if (outletId && outletId !== 'all') {
      where.employee = { ...where.employee, outletId }
    }

    const attendance = await db.attendance.findMany({
      where,
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: [{ date: 'desc' }, { clockIn: 'asc' }],
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
