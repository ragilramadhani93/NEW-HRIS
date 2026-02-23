import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE - Remove incentive or deduction
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await db.payrollIncentive.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Incentive deleted successfully' })
    } catch (error) {
        console.error('Error deleting incentive:', error)
        return NextResponse.json({ error: 'Failed to delete incentive' }, { status: 500 })
    }
}
