import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT - Update outlet
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, address, latitude, longitude, radius, dailyRate, workStartTime, workEndTime, isActive, shifts } = body

        // Prepare shift operations if shifts are provided
        const shiftOperations = shifts ? {
            deleteMany: {
                id: {
                    notIn: shifts.filter((s: any) => s.id).map((s: any) => s.id)
                }
            },
            create: shifts.filter((s: any) => !s.id).map((s: any) => ({
                name: s.name,
                startTime: s.startTime,
                endTime: s.endTime
            })),
            update: shifts.filter((s: any) => s.id).map((s: any) => ({
                where: { id: s.id },
                data: {
                    name: s.name,
                    startTime: s.startTime,
                    endTime: s.endTime
                }
            }))
        } : undefined

        const outlet = await db.outlet.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
                ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
                ...(radius !== undefined && { radius: parseInt(radius) }),
                ...(dailyRate !== undefined && { dailyRate: parseFloat(dailyRate) }),
                ...(workStartTime !== undefined && { workStartTime }),
                ...(workEndTime !== undefined && { workEndTime }),
                ...(isActive !== undefined && { isActive }),
                ...(shiftOperations && { shifts: shiftOperations })
            },
            include: {
                shifts: true
            }
        })

        return NextResponse.json(outlet)
    } catch (error) {
        console.error('Error updating outlet:', error)
        return NextResponse.json({ error: 'Failed to update outlet' }, { status: 500 })
    }
}

// DELETE - Delete outlet
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check if employees are assigned
        const employeeCount = await db.employee.count({ where: { outletId: id } })
        if (employeeCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete outlet with ${employeeCount} assigned employee(s). Reassign them first.` },
                { status: 400 }
            )
        }

        await db.outlet.delete({ where: { id } })
        return NextResponse.json({ message: 'Outlet deleted successfully' })
    } catch (error) {
        console.error('Error deleting outlet:', error)
        return NextResponse.json({ error: 'Failed to delete outlet' }, { status: 500 })
    }
}
