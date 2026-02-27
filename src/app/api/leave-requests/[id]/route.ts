import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH - Update leave request status (approve/reject)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status, adminNotes } = body

        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Status must be APPROVED or REJECTED' }, { status: 400 })
        }

        const leaveRequest = await db.leaveRequest.update({
            where: { id },
            data: {
                status,
                adminNotes: adminNotes || null
            },
            include: {
                employee: {
                    select: { id: true, employeeId: true, name: true, position: true }
                }
            }
        })

        return NextResponse.json(leaveRequest)
    } catch (error) {
        console.error('Error updating leave request:', error)
        return NextResponse.json({ error: 'Failed to update leave request' }, { status: 500 })
    }
}

// DELETE - Delete a leave request
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await db.leaveRequest.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting leave request:', error)
        return NextResponse.json({ error: 'Failed to delete leave request' }, { status: 500 })
    }
}
