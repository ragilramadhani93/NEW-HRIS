import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_SETTINGS = {
  companyName: 'PT. Example Company',
  workStartTime: '09:00',
  workEndTime: '17:00',
  lateThreshold: '15',
}

// GET - Get settings
export async function GET() {
  try {
    const settings = await db.setting.findMany()
    
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
    settings.forEach((s) => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({
      companyName: settingsMap.companyName,
      workStartTime: settingsMap.workStartTime,
      workEndTime: settingsMap.workEndTime,
      lateThreshold: parseInt(settingsMap.lateThreshold),
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, workStartTime, workEndTime, lateThreshold } = body

    const settingsToUpdate = [
      { key: 'companyName', value: companyName },
      { key: 'workStartTime', value: workStartTime },
      { key: 'workEndTime', value: workEndTime },
      { key: 'lateThreshold', value: String(lateThreshold) },
    ]

    for (const setting of settingsToUpdate) {
      await db.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: { key: setting.key, value: setting.value },
      })
    }

    return NextResponse.json({
      companyName,
      workStartTime,
      workEndTime,
      lateThreshold,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
