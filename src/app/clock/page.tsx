'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast, Toaster } from 'sonner'

interface Employee {
    id: string
    employeeId: string
    name: string
    position: string
    outlet?: { name: string } | null
}

interface TodayAttendance {
    id: string
    clockIn: string | null
    clockOut: string | null
    status: string
}

export default function MobileClockPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>('')
    const [todayStatus, setTodayStatus] = useState<TodayAttendance | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClocking, setIsClocking] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // Camera
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch employees
    useEffect(() => {
        fetch('/api/employees')
            .then(res => res.json())
            .then(data => {
                setEmployees(Array.isArray(data) ? data.filter((e: Employee & { isActive: boolean }) => e.isActive) : [])
                setIsLoading(false)
            })
            .catch(() => setIsLoading(false))
    }, [])

    // Get GPS
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => setLocationError('GPS tidak tersedia: ' + err.message),
                { enableHighAccuracy: true }
            )
        } else {
            setLocationError('GPS tidak didukung oleh browser ini')
        }
    }, [])

    // Fetch today's attendance when employee selected
    useEffect(() => {
        if (!selectedEmployee) {
            setTodayStatus(null)
            return
        }
        fetch(`/api/attendance/today?employeeId=${selectedEmployee}`)
            .then(res => res.json())
            .then(data => setTodayStatus(data))
            .catch(() => setTodayStatus(null))
    }, [selectedEmployee])

    // Camera functions
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 480, height: 480 }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setIsCameraActive(true)
            }
        } catch {
            toast.error('Tidak bisa akses kamera')
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(t => t.stop())
            videoRef.current.srcObject = null
            setIsCameraActive(false)
        }
    }, [])

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return
        const canvas = document.createElement('canvas')
        canvas.width = 480
        canvas.height = 480
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 480, 480)
            setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.7))
            stopCamera()
        }
    }, [stopCamera])

    // Clock In/Out
    const handleClockIn = async () => {
        if (!selectedEmployee) { toast.error('Pilih karyawan terlebih dahulu'); return }
        if (!location) { toast.error('GPS belum tersedia'); return }

        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee,
                    location,
                    photo: capturedPhoto,
                    settings: { workStartTime: '09:00', lateThreshold: 15 }
                })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Clock In berhasil!')
                setTodayStatus(data)
                setCapturedPhoto(null)
            } else {
                toast.error(data.error || 'Gagal clock in')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setIsClocking(false)
        }
    }

    const handleClockOut = async () => {
        if (!selectedEmployee) return

        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployee,
                    location,
                    photo: capturedPhoto,
                    settings: { workEndTime: '17:00' }
                })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Clock Out berhasil!')
                setTodayStatus(data)
                setCapturedPhoto(null)
            } else {
                toast.error(data.error || 'Gagal clock out')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setIsClocking(false)
        }
    }

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedEmpData = employees.find(e => e.id === selectedEmployee)

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-slate-400 text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
            <Toaster richColors position="top-center" />

            {/* Header */}
            <header className="bg-[#1e293b] border-b border-slate-700 px-4 py-3 safe-area-top">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-sm">HRIS Clock</span>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold font-mono tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Employee Selection */}
                {!selectedEmployee ? (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold">Pilih Karyawan</h2>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama atau ID..."
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredEmployees.map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => { setSelectedEmployee(emp.id); setSearchTerm('') }}
                                    className="w-full flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-indigo-500 active:bg-slate-700 transition-colors text-left"
                                >
                                    <div className="h-10 w-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{emp.name}</p>
                                        <p className="text-xs text-slate-400">{emp.position} • {emp.employeeId}</p>
                                    </div>
                                    <svg className="h-4 w-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <p className="text-center text-slate-500 py-8 text-sm">Tidak ada karyawan ditemukan</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Selected Employee Card */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold">
                                        {selectedEmpData?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="font-bold">{selectedEmpData?.name}</p>
                                        <p className="text-xs text-slate-400">{selectedEmpData?.position}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedEmployee(''); setTodayStatus(null); setCapturedPhoto(null); stopCamera() }}
                                    className="text-xs text-indigo-400 font-bold px-3 py-1.5 bg-indigo-600/10 rounded-lg"
                                >
                                    Ganti
                                </button>
                            </div>
                        </div>

                        {/* Today's Status */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Status Hari Ini</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Clock In</p>
                                    <p className="font-bold font-mono text-lg text-green-400">
                                        {todayStatus?.clockIn || '--:--:--'}
                                    </p>
                                </div>
                                <div className="bg-slate-900 rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Clock Out</p>
                                    <p className="font-bold font-mono text-lg text-orange-400">
                                        {todayStatus?.clockOut || '--:--:--'}
                                    </p>
                                </div>
                            </div>
                            {todayStatus?.status && (
                                <div className="mt-3 text-center">
                                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${todayStatus.status === 'PRESENT' ? 'bg-green-600/20 text-green-400' :
                                            todayStatus.status === 'LATE' ? 'bg-orange-600/20 text-orange-400' :
                                                'bg-slate-600/20 text-slate-400'
                                        }`}>
                                        {todayStatus.status}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* GPS Status */}
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium ${location ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'bg-red-600/10 text-red-400 border border-red-600/20'
                            }`}>
                            <div className={`h-2 w-2 rounded-full ${location ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                            {location ? `GPS Aktif (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : (locationError || 'Mencari GPS...')}
                        </div>

                        {/* Camera */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Foto (Opsional)</h3>
                                {!isCameraActive && !capturedPhoto && (
                                    <button onClick={startCamera} className="text-xs text-indigo-400 font-bold px-3 py-1 bg-indigo-600/10 rounded-lg">
                                        Buka Kamera
                                    </button>
                                )}
                            </div>
                            <div className="aspect-square bg-slate-900 relative">
                                {isCameraActive ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                            <button onClick={capturePhoto} className="bg-white h-16 w-16 rounded-full border-4 border-slate-300 active:scale-95 transition-transform"></button>
                                            <button onClick={stopCamera} className="bg-red-500 h-12 w-12 rounded-full flex items-center justify-center self-center">
                                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </>
                                ) : capturedPhoto ? (
                                    <>
                                        <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => { setCapturedPhoto(null); startCamera() }}
                                            className="absolute bottom-4 right-4 bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg border border-slate-600"
                                        >
                                            Ulangi
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-600">
                                        <div className="text-center">
                                            <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-xs">Tap "Buka Kamera" untuk foto</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Action Buttons */}
            {selectedEmployee && (
                <div className="p-4 bg-[#1e293b] border-t border-slate-700 safe-area-bottom">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleClockIn}
                            disabled={isClocking || !location || (todayStatus?.clockIn !== null && todayStatus?.clockIn !== undefined)}
                            className="py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isClocking ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                            ) : (
                                <>
                                    <svg className="h-6 w-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    CLOCK IN
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClockOut}
                            disabled={isClocking || !location || !todayStatus?.clockIn || (todayStatus?.clockOut !== null && todayStatus?.clockOut !== undefined)}
                            className="py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {isClocking ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                            ) : (
                                <>
                                    <svg className="h-6 w-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    CLOCK OUT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
