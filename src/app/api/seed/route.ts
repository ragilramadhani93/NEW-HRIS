import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Seed initial data (departments and sample employees)
export async function POST() {
  try {
    // Check if departments already exist
    const existingDepartments = await db.department.findMany()
    
    if (existingDepartments.length === 0) {
      // Create departments
      const departments = await Promise.all([
        db.department.create({ data: { name: 'Engineering' } }),
        db.department.create({ data: { name: 'Marketing' } }),
        db.department.create({ data: { name: 'Finance' } }),
        db.department.create({ data: { name: 'Human Resources' } }),
        db.department.create({ data: { name: 'Operations' } }),
        db.department.create({ data: { name: 'Sales' } }),
      ])

      // Create sample employees
      const sampleEmployees = [
        {
          employeeId: 'EMP001',
          name: 'John Doe',
          email: 'john.doe@company.com',
          phone: '+62 812-0001-0001',
          position: 'Software Engineer',
          departmentId: departments[0].id,
          isActive: true,
        },
        {
          employeeId: 'EMP002',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          phone: '+62 812-0001-0002',
          position: 'Marketing Manager',
          departmentId: departments[1].id,
          isActive: true,
        },
        {
          employeeId: 'EMP003',
          name: 'Ahmad Wijaya',
          email: 'ahmad.wijaya@company.com',
          phone: '+62 812-0001-0003',
          position: 'Finance Analyst',
          departmentId: departments[2].id,
          isActive: true,
        },
        {
          employeeId: 'EMP004',
          name: 'Siti Rahayu',
          email: 'siti.rahayu@company.com',
          phone: '+62 812-0001-0004',
          position: 'HR Specialist',
          departmentId: departments[3].id,
          isActive: true,
        },
        {
          employeeId: 'EMP005',
          name: 'Budi Santoso',
          email: 'budi.santoso@company.com',
          phone: '+62 812-0001-0005',
          position: 'Operations Lead',
          departmentId: departments[4].id,
          isActive: true,
        },
      ]

      await Promise.all(
        sampleEmployees.map((emp) =>
          db.employee.create({
            data: emp,
          })
        )
      )

      // Create default settings
      await Promise.all([
        db.setting.upsert({
          where: { key: 'companyName' },
          update: { value: 'PT. Example Company' },
          create: { key: 'companyName', value: 'PT. Example Company' },
        }),
        db.setting.upsert({
          where: { key: 'workStartTime' },
          update: { value: '09:00' },
          create: { key: 'workStartTime', value: '09:00' },
        }),
        db.setting.upsert({
          where: { key: 'workEndTime' },
          update: { value: '17:00' },
          create: { key: 'workEndTime', value: '17:00' },
        }),
        db.setting.upsert({
          where: { key: 'lateThreshold' },
          update: { value: '15' },
          create: { key: 'lateThreshold', value: '15' },
        }),
      ])

      return NextResponse.json({
        message: 'Seed data created successfully',
        departments: departments.length,
        employees: sampleEmployees.length,
      })
    }

    return NextResponse.json({ message: 'Data already exists' })
  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}

// GET - Get all departments
export async function GET() {
  try {
    const departments = await db.department.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
  }
}
