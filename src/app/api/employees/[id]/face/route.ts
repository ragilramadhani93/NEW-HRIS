import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Register face descriptor for employee
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { faceDescriptor, photoUrl } = body

    const employee = await db.employee.update({
      where: { id },
      data: {
        faceDescriptor: JSON.stringify(faceDescriptor),
        photoUrl: photoUrl || null,
      },
      include: { department: true },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error registering face:', error)
    return NextResponse.json({ error: 'Failed to register face' }, { status: 500 })
  }
}
