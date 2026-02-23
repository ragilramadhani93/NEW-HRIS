import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all outlets
export async function GET() {
    try {
        const outlets = await db.outlet.findMany({
            include: {
                _count: { select: { employees: true } },
                shifts: true
            },
            orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json(outlets)
    } catch (error) {
        console.error('Error fetching outlets:', error)
        return NextResponse.json({ error: 'Failed to fetch outlets' }, { status: 500 })
    }
}

// POST - Create new outlet
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, address, latitude, longitude, radius, dailyRate, workStartTime, workEndTime, shifts } = body

        if (!name || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: name, latitude, longitude' },
                { status: 400 }
            )
        }

        const existing = await db.outlet.findUnique({ where: { name } })
        if (existing) {
            return NextResponse.json({ error: 'Outlet name already exists' }, { status: 400 })
        }

        const outlet = await db.outlet.create({
            data: {
                name,
                address: address || null,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseInt(radius) || 100,
                dailyRate: parseFloat(dailyRate) || 0,
                workStartTime: workStartTime || '09:00',
                workEndTime: workEndTime || '17:00',
                shifts: {
                    create: shifts?.map((s: any) => ({
                        name: s.name,
                        startTime: s.startTime,
                        endTime: s.endTime
                    })) || []
                }
            },
            include: {
                shifts: true
            }
        })

        return NextResponse.json(outlet, { status: 201 })
    } catch (error) {
        console.error('Error creating outlet:', error)
        return NextResponse.json({ error: 'Failed to create outlet' }, { status: 500 })
    }
}
