import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Add new incentive or deduction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { employeeId, date, name, amount, type } = body

        if (!employeeId || !date || !name || amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: employeeId, date, name, amount' },
                { status: 400 }
            )
        }

        const validTypes = ['ADDITION', 'DEDUCTION']
        if (type && !validTypes.includes(type)) {
            return NextResponse.json(
                { error: `Invalid type. Must be one of ${validTypes.join(', ')}` },
                { status: 400 }
            )
        }

        const parsedAmount = parseFloat(amount.toString())
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return NextResponse.json(
                { error: 'Amount must be a positive number' },
                { status: 400 }
            )
        }

        const incentive = await db.payrollIncentive.create({
            data: {
                employeeId,
                date, // Expected format YYYY-MM
                name,
                amount: parsedAmount,
                type: type || 'ADDITION'
            }
        })

        return NextResponse.json(incentive, { status: 201 })
    } catch (error) {
        console.error('Error creating incentive:', error)
        return NextResponse.json({ error: 'Failed to create incentive' }, { status: 500 })
    }
}
