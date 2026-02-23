import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get single employee
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const employee = await db.employee.findUnique({
      where: { id },
      include: { department: true },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT - Update employee
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, position, departmentId, outletId, shiftId, isActive } = body

    // Validate departmentId if provided
    let validDepartmentId: string | null = null
    if (departmentId && departmentId.trim() !== '') {
      const department = await db.department.findUnique({
        where: { id: departmentId },
      })
      if (department) {
        validDepartmentId = departmentId
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        name,
        email,
        phone: phone || null,
        position,
        departmentId: validDepartmentId,
        outletId: outletId || null,
        shiftId: shiftId || null,
        isActive: isActive ?? true,
      },
      include: {
        department: true,
        outlet: { include: { shifts: true } },
        shift: true
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee', details: String(error) }, { status: 500 })
  }
}

// DELETE - Delete employee
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Delete related attendance records first
    await db.attendance.deleteMany({
      where: { employeeId: id },
    })

    await db.employee.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
