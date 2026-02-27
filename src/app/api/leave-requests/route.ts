import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all leave requests
export async function GET() {
    try {
        const leaveRequests = await db.leaveRequest.findMany({
            include: {
                employee: {
                    select: { id: true, employeeId: true, name: true, position: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(leaveRequests)
    } catch (error) {
        console.error('Error fetching leave requests:', error)
        return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
    }
}

// POST - Create new leave request
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { employeeId, type, startDate, endDate, reason, evidence, evidenceName } = body

        if (!employeeId || !type || !startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!['IZIN', 'SAKIT'].includes(type)) {
            return NextResponse.json({ error: 'Type must be IZIN or SAKIT' }, { status: 400 })
        }

        const leaveRequest = await db.leaveRequest.create({
            data: {
                employeeId,
                type,
                startDate,
                endDate,
                reason,
                evidence: evidence || null,
                evidenceName: evidenceName || null,
                status: 'PENDING'
            },
            include: {
                employee: {
                    select: { id: true, employeeId: true, name: true, position: true }
                }
            }
        })

        return NextResponse.json(leaveRequest, { status: 201 })
    } catch (error) {
        console.error('Error creating leave request:', error)
        return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
    }
}
