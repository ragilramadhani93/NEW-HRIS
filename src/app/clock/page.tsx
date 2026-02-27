'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast, Toaster } from 'sonner'

declare global {
    interface Window {
        faceapi: any
    }
}

interface Employee {
    id: string
    employeeId: string
    name: string
    position: string
    faceDescriptor: string | null
    outlet?: { name: string } | null
}

interface TodayAttendance {
    id: string
    clockIn: string | null
    clockOut: string | null
    status: string
}

const MIN_MATCH_SCORE = 60

// Manual Euclidean distance (face-api.js doesn't expose this as standalone)
function euclideanDistance(a: number[], b: number[]): number {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2
    }
    return Math.sqrt(sum)
}

export default function MobileClockPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const employeesRef = useRef<Employee[]>([])
    const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null)
    const matchedEmployeeRef = useRef<Employee | null>(null)
    const [matchScore, setMatchScore] = useState<number>(0)
    const [todayStatus, setTodayStatus] = useState<TodayAttendance | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isClocking, setIsClocking] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState('')

    // Face recognition
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [scanStatus, setScanStatus] = useState('Memuat model face recognition...')
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
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
                const active = Array.isArray(data) ? data.filter((e: Employee & { isActive: boolean }) => e.isActive) : []
                setEmployees(active)
                employeesRef.current = active
                console.log('Employees loaded:', active.length, 'with face:', active.filter(e => e.faceDescriptor).length)
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

    // Load face-api.js
    useEffect(() => {
        const loadFaceApi = async () => {
            try {
                const script = document.createElement('script')
                script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js'
                script.async = true
                script.onload = async () => {
                    setScanStatus('Memuat model AI...')
                    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
                    await Promise.all([
                        window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    ])
                    setModelsLoaded(true)
                    setScanStatus('Model siap! Mengarahkan kamera...')
                }
                document.head.appendChild(script)
            } catch {
                setScanStatus('Gagal memuat model face recognition')
            }
        }
        loadFaceApi()
    }, [])

    // Start camera after models loaded
    useEffect(() => {
        if (modelsLoaded && !matchedEmployee) {
            startCamera()
        }
        return () => stopScanning()
    }, [modelsLoaded, matchedEmployee])

    // Fetch today status when employee matched
    useEffect(() => {
        if (!matchedEmployee) {
            setTodayStatus(null)
            return
        }
        fetch(`/api/attendance/today?employeeId=${matchedEmployee.id}`)
            .then(res => res.json())
            .then(data => setTodayStatus(data))
            .catch(() => setTodayStatus(null))
    }, [matchedEmployee])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play()
                    setIsScanning(true)
                    setScanStatus('Arahkan wajah ke kamera...')
                    startScanning()
                }
            }
        } catch {
            setScanStatus('Tidak bisa akses kamera')
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(t => t.stop())
            videoRef.current.srcObject = null
        }
        setIsScanning(false)
        stopScanning()
    }

    const stopScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
    }

    const startScanning = () => {
        stopScanning()
        scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !window.faceapi || matchedEmployeeRef.current) return

            try {
                const detection = await window.faceapi
                    .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
                    .withFaceLandmarks()
                    .withFaceDescriptor()

                if (detection) {
                    setScanStatus('Wajah terdeteksi, mencocokkan...')
                    const currentDescriptor = Array.from(detection.descriptor) as number[]
                    console.log('Current face descriptor length:', currentDescriptor.length)

                    // Match against all employees with face descriptors
                    let bestMatch: { employee: Employee; score: number } | null = null
                    const currentEmployees = employeesRef.current
                    const empsWithFace = currentEmployees.filter(e => e.faceDescriptor)
                    console.log(`Employees total: ${currentEmployees.length}, with face: ${empsWithFace.length}`)

                    for (const emp of empsWithFace) {
                        try {
                            const raw = emp.faceDescriptor!
                            console.log(`${emp.name} raw descriptor type:`, typeof raw, 'first 50 chars:', raw.substring(0, 50))

                            // Parse the stored descriptor - handle multiple formats
                            let parsed = JSON.parse(raw)

                            // If it's a string (double-stringified), parse again
                            if (typeof parsed === 'string') {
                                console.log(`${emp.name}: double-stringified, parsing again`)
                                parsed = JSON.parse(parsed)
                            }

                            // If it's a nested array [[...]], unwrap
                            if (Array.isArray(parsed) && parsed.length === 1 && Array.isArray(parsed[0])) {
                                console.log(`${emp.name}: nested array, unwrapping`)
                                parsed = parsed[0]
                            }

                            // If it's an object with numeric keys (like Float32Array serialized), convert
                            if (!Array.isArray(parsed) && typeof parsed === 'object') {
                                console.log(`${emp.name}: object format, converting to array`)
                                parsed = Object.values(parsed)
                            }

                            const storedDescriptor = parsed as number[]
                            console.log(`${emp.name} stored descriptor length:`, storedDescriptor.length)

                            if (storedDescriptor.length !== currentDescriptor.length) {
                                console.warn(`${emp.name}: descriptor length mismatch! stored=${storedDescriptor.length} current=${currentDescriptor.length}`)
                                continue
                            }

                            const distance = euclideanDistance(currentDescriptor, storedDescriptor)
                            const score = Math.round(Math.max(0, (1 - distance / 0.6)) * 100)
                            console.log(`${emp.name}: distance=${distance.toFixed(4)}, score=${score}%`)

                            if (score >= MIN_MATCH_SCORE && (!bestMatch || score > bestMatch.score)) {
                                bestMatch = { employee: emp, score }
                            }
                        } catch (parseErr) {
                            console.error(`Error parsing face data for ${emp.name}:`, parseErr)
                            console.error(`Raw data:`, emp.faceDescriptor?.substring(0, 100))
                        }
                    }

                    if (bestMatch) {
                        // Capture photo
                        const canvas = document.createElement('canvas')
                        canvas.width = videoRef.current.videoWidth
                        canvas.height = videoRef.current.videoHeight
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0)
                            setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.7))
                        }

                        matchedEmployeeRef.current = bestMatch.employee
                        setMatchedEmployee(bestMatch.employee)
                        setMatchScore(bestMatch.score)
                        setScanStatus(`Dikenali: ${bestMatch.employee.name}`)
                        stopCamera()
                        toast.success(`Dikenali: ${bestMatch.employee.name} (${bestMatch.score}%)`)
                    } else {
                        const faceCount = empsWithFace.length
                        setScanStatus(faceCount === 0 ? 'Tidak ada wajah terdaftar!' : 'Wajah tidak dikenali, coba lagi...')
                    }
                } else {
                    setScanStatus('Arahkan wajah ke kamera...')
                }
            } catch (scanErr) {
                console.error('Face scan error:', scanErr)
            }
        }, 1500)
    }

    // Reset / scan again
    const resetScan = () => {
        matchedEmployeeRef.current = null
        setMatchedEmployee(null)
        setMatchScore(0)
        setTodayStatus(null)
        setCapturedPhoto(null)
        setScanStatus('Mengarahkan kamera...')
        setTimeout(() => startCamera(), 300)
    }

    // Clock In/Out
    const handleClockIn = async () => {
        if (!matchedEmployee) return
        if (!location) { toast.error('GPS belum tersedia'); return }

        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: matchedEmployee.id,
                    location,
                    photo: capturedPhoto,
                    settings: { workStartTime: '09:00', lateThreshold: 15 }
                })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Clock In berhasil!')
                setTodayStatus(data)
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
        if (!matchedEmployee) return
        if (!location) { toast.error('GPS belum tersedia'); return }

        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: matchedEmployee.id,
                    location,
                    photo: capturedPhoto,
                    settings: { workEndTime: '17:00' }
                })
            })
            const data = await res.json()
            if (res.ok) {
                toast.success('Clock Out berhasil!')
                setTodayStatus(data)
            } else {
                toast.error(data.error || 'Gagal clock out')
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setIsClocking(false)
        }
    }

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
            <header className="bg-[#1e293b] border-b border-slate-700 px-4 py-3">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {!matchedEmployee ? (
                    /* ===== SCANNING MODE ===== */
                    <>
                        {/* Camera / Scanner */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                            <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : modelsLoaded ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Face Recognition</span>
                            </div>
                            <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Scan overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-48 h-48 border-2 border-indigo-500/50 rounded-full relative">
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full"></div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full"></div>
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full"></div>
                                        <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full"></div>
                                        {isScanning && (
                                            <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Status bar */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
                                    <div className="flex items-center gap-2 justify-center">
                                        {isScanning && (
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-400"></div>
                                        )}
                                        <p className="text-sm font-medium text-center">{scanStatus}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Min Score Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                                <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Min skor: <strong className="text-indigo-400">{MIN_MATCH_SCORE}%</strong> • Wajah terdaftar: <strong className="text-indigo-400">{employees.filter(e => e.faceDescriptor).length}</strong>/{employees.length}</p>
                                <p className="text-[10px] text-slate-500">Arahkan wajah ke kamera untuk identifikasi otomatis</p>
                            </div>
                        </div>

                        {/* GPS Status */}
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium ${location ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'bg-red-600/10 text-red-400 border border-red-600/20'
                            }`}>
                            <div className={`h-2 w-2 rounded-full ${location ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                            {location ? `GPS Aktif (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : (locationError || 'Mencari GPS...')}
                        </div>
                    </>
                ) : (
                    /* ===== MATCHED MODE ===== */
                    <>
                        {/* Matched Employee Card */}
                        <div className="bg-gradient-to-r from-indigo-600/20 to-indigo-700/10 border border-indigo-500/30 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {capturedPhoto ? (
                                        <img src={capturedPhoto} alt="Face" className="h-14 w-14 rounded-full object-cover border-2 border-indigo-500" />
                                    ) : (
                                        <div className="h-14 w-14 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                                            {matchedEmployee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-lg">{matchedEmployee.name}</p>
                                        <p className="text-xs text-slate-400">{matchedEmployee.position} • {matchedEmployee.employeeId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={resetScan}
                                    className="text-xs text-indigo-400 font-bold px-3 py-1.5 bg-indigo-600/20 rounded-lg border border-indigo-500/20"
                                >
                                    Scan Ulang
                                </button>
                            </div>
                            {/* Match Score Bar */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider w-20">Match Score</span>
                                <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all"
                                        style={{ width: `${matchScore}%` }}
                                    ></div>
                                </div>
                                <span className="font-bold text-sm text-green-400">{matchScore}%</span>
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
                    </>
                )}
            </div>

            {/* Bottom Action Buttons */}
            {matchedEmployee && (
                <div className="p-4 bg-[#1e293b] border-t border-slate-700">
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
