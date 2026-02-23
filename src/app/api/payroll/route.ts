import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Calculate monthly payroll
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month') // Format: YYYY-MM
        const outletId = searchParams.get('outletId')

        if (!month) {
            return NextResponse.json({ error: 'Month parameter (YYYY-MM) is required' }, { status: 400 })
        }

        // Parse start and end dates for the given month
        const [yearStr, monthStr] = month.split('-')
        const year = parseInt(yearStr)
        const monthNum = parseInt(monthStr)

        // Start date: e.g., "2026-02-01"
        const startDate = `${year}-${monthStr}-01`

        // End date: last day of the month
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1
        const nextMonthYear = monthNum === 12 ? year + 1 : year
        const lastDay = new Date(nextMonthYear, nextMonth - 1, 0).getDate()
        const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`

        // Build where clause for employeese
        const employeeWhere: any = { isActive: true }
        if (outletId && outletId !== 'all') {
            employeeWhere.outletId = outletId
        }

        // Fetch employees with their outlet, attendance for the month, and incentives for the month
        const employees = await db.employee.findMany({
            where: employeeWhere,
            include: {
                department: true,
                outlet: true,
                attendance: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                },
                payrollIncentives: {
                    where: {
                        date: month
                    }
                }
            }
        })

        // Calculate payroll for each employee
        const payrollData = employees.map(emp => {
            // Calculate days present (including Late, but excluding Absent/Early Leave if you want to be strict, 
            // but usually PRESENT and LATE count as a working day. Or EARLY_LEAVE could count too depending on policy.
            // We'll count PRESENT, LATE, and EARLY_LEAVE as present days for this simple payroll logic)
            const presentDays = emp.attendance.filter(a =>
                ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(a.status)
            ).length

            // Basic salary based on daily rate of outlet
            const dailyRate = emp.outlet?.dailyRate || 0
            const basicSalary = presentDays * dailyRate

            // Calculate incentives and deductions
            let totalAdditions = 0
            let totalDeductions = 0

            emp.payrollIncentives.forEach(inc => {
                if (inc.type === 'ADDITION') {
                    totalAdditions += inc.amount
                } else if (inc.type === 'DEDUCTION') {
                    totalDeductions += inc.amount
                }
            })

            const totalPay = basicSalary + totalAdditions - totalDeductions

            return {
                id: emp.id,
                employeeId: emp.employeeId,
                name: emp.name,
                department: emp.department?.name || '-',
                outletName: emp.outlet?.name || '-',
                dailyRate,
                presentDays,
                basicSalary,
                additions: totalAdditions,
                deductions: totalDeductions,
                totalPay,
                incentives: emp.payrollIncentives
            }
        })

        return NextResponse.json(payrollData)
    } catch (error) {
        console.error('Error calculating payroll:', error)
        return NextResponse.json({ error: 'Failed to calculate payroll' }, { status: 500 })
    }
}
