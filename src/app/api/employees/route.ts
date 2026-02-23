import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all employees
export async function GET() {
  try {
    const employees = await db.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        position: true,
        departmentId: true,
        department: true,
        outletId: true,
        outlet: { include: { shifts: true } },
        shiftId: true,
        shift: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Only check if faceDescriptor exists, don't return the full data
        faceDescriptor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    // Keep faceDescriptor data (128 floats, ~500 bytes) needed for face matching
    // Exclude photoUrl entirely to keep response small
    const result = employees.map(e => ({
      ...e,
      photoUrl: null,
    }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching employees:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    const errStack = error instanceof Error ? error.stack : ''
    return NextResponse.json({ error: 'Failed to fetch employees', message: errMsg, stack: errStack }, { status: 500 })
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  console.log("API ROUTE /api/employees HIT")
  try {
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed successfully");
      console.log("Body keys:", Object.keys(body));
      if (body.faceDescriptor) console.log("FaceDescriptor length:", Array.isArray(body.faceDescriptor) ? body.faceDescriptor.length : 'not an array');
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { employeeId, name, email, phone, position, departmentId, outletId, shiftId, faceDescriptor, photo } = body

    // Validate required fields
    if (!employeeId || !name || !email || !position) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, name, email, position' },
        { status: 400 }
      )
    }

    // Check if employeeId or email already exists
    const existing = await db.employee.findFirst({
      where: {
        OR: [{ employeeId }, { email }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.employeeId === employeeId ? 'Employee ID already exists' : 'Email already exists' },
        { status: 400 }
      )
    }

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



    console.log("Creating employee in DB...");
    const startTime = Date.now();
    const employee = await db.employee.create({
      data: {
        employeeId,
        name,
        email,
        phone: phone || null,
        position,
        departmentId: departmentId || null,
        outletId: outletId || null,
        shiftId: shiftId || null,
        faceDescriptor,
        // photoUrl: null // No longer storing photoUrl in DB
      },
      include: {
        department: true,
      },
    })
    const duration = Date.now() - startTime;
    console.log(`DB Operation completed in ${duration}ms`);

    // Return minimal response to avoid large payload
    return NextResponse.json({
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      message: "Employee created successfully",
      duration: duration
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee', details: String(error) }, { status: 500 })
  }
}
