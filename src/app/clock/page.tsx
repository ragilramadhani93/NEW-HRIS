'use client'

import { useState, useEffect, useRef } from 'react'
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

    // Face recognition
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [faceDetected, setFaceDetected] = useState(false)
    const [scanStatus, setScanStatus] = useState('Memuat model...')
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
    const [cameraActive, setCameraActive] = useState(false)

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
                setIsLoading(false)
            })
            .catch(() => setIsLoading(false))
    }, [])

    // Get GPS
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { },
                { enableHighAccuracy: true }
            )
        }
    }, [])

    // Load face-api.js
    useEffect(() => {
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
            setScanStatus('System Ready')
        }
        document.head.appendChild(script)
    }, [])

    // Start camera after models loaded
    useEffect(() => {
        if (modelsLoaded && !matchedEmployee) {
            const timer = setTimeout(() => startCamera(), 500)
            return () => clearTimeout(timer)
        }
        return () => stopScanning()
    }, [modelsLoaded, matchedEmployee])

    // Fetch today status
    useEffect(() => {
        if (!matchedEmployee) { setTodayStatus(null); return }
        fetch(`/api/attendance/today?employeeId=${matchedEmployee.id}`)
            .then(res => res.json())
            .then(data => setTodayStatus(data))
            .catch(() => setTodayStatus(null))
    }, [matchedEmployee])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.setAttribute('playsinline', 'true')
                videoRef.current.muted = true
                await videoRef.current.play()
                setCameraActive(true)
                setIsScanning(true)
                startScanning()
            }
        } catch (err) {
            setScanStatus('Kamera gagal: ' + (err instanceof Error ? err.message : ''))
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream
            stream.getTracks().forEach(t => t.stop())
            videoRef.current.srcObject = null
        }
        setCameraActive(false)
        setIsScanning(false)
        setFaceDetected(false)
        stopScanning()
        // Clear canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
    }

    const stopScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
    }

    // Draw green tracking box
    const drawFaceBox = (detection: any) => {
        if (!canvasRef.current || !videoRef.current) return
        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const box = detection.detection.box
        const x = box.x
        const y = box.y
        const w = box.width
        const h = box.height

        // Green rectangle
        ctx.strokeStyle = '#22c55e'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, w, h)

        // Corner accents
        const cornerLen = 20
        ctx.lineWidth = 4
        ctx.strokeStyle = '#22c55e'
        // Top-left
        ctx.beginPath(); ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y); ctx.stroke()
        // Top-right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cornerLen); ctx.stroke()
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(x, y + h - cornerLen); ctx.lineTo(x, y + h); ctx.lineTo(x + cornerLen, y + h); ctx.stroke()
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(x + w - cornerLen, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cornerLen); ctx.stroke()
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
                    setFaceDetected(true)
                    drawFaceBox(detection)

                    const currentDescriptor = Array.from(detection.descriptor) as number[]
                    const currentEmployees = employeesRef.current
                    const empsWithFace = currentEmployees.filter(e => e.faceDescriptor)

                    let bestMatch: { employee: Employee; score: number } | null = null

                    for (const emp of empsWithFace) {
                        try {
                            const raw = emp.faceDescriptor!
                            let parsed = JSON.parse(raw)
                            if (typeof parsed === 'string') parsed = JSON.parse(parsed)
                            if (Array.isArray(parsed) && parsed.length === 1 && Array.isArray(parsed[0])) parsed = parsed[0]
                            if (!Array.isArray(parsed) && typeof parsed === 'object') parsed = Object.values(parsed)

                            const storedDescriptor = parsed as number[]
                            if (storedDescriptor.length !== currentDescriptor.length) continue

                            const distance = euclideanDistance(currentDescriptor, storedDescriptor)
                            const score = Math.round(Math.max(0, (1 - distance / 0.6)) * 100)

                            if (score >= MIN_MATCH_SCORE && (!bestMatch || score > bestMatch.score)) {
                                bestMatch = { employee: emp, score }
                            }
                        } catch { /* skip */ }
                    }

                    if (bestMatch) {
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
                        toast.success(`Dikenali: ${bestMatch.employee.name} (${bestMatch.score}%)`)
                    }
                } else {
                    setFaceDetected(false)
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d')
                        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                    }
                }
            } catch { /* retry */ }
        }, 1000)
    }

    const resetScan = () => {
        matchedEmployeeRef.current = null
        setMatchedEmployee(null)
        setMatchScore(0)
        setTodayStatus(null)
        setCapturedPhoto(null)
        setFaceDetected(false)
        setTimeout(() => startCamera(), 300)
    }

    const handleClockIn = async () => {
        if (!matchedEmployee || !location) return
        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: matchedEmployee.id, location, photo: capturedPhoto,
                    settings: { workStartTime: '09:00', lateThreshold: 15 }
                })
            })
            const data = await res.json()
            if (res.ok) { toast.success('Clock In berhasil!'); setTodayStatus(data) }
            else toast.error(data.error || 'Gagal clock in')
        } catch { toast.error('Terjadi kesalahan') }
        finally { setIsClocking(false) }
    }

    const handleClockOut = async () => {
        if (!matchedEmployee || !location) return
        setIsClocking(true)
        try {
            const res = await fetch('/api/attendance/clock-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: matchedEmployee.id, location, photo: capturedPhoto,
                    settings: { workEndTime: '17:00' }
                })
            })
            const data = await res.json()
            if (res.ok) { toast.success('Clock Out berhasil!'); setTodayStatus(data) }
            else toast.error(data.error || 'Gagal clock out')
        } catch { toast.error('Terjadi kesalahan') }
        finally { setIsClocking(false) }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
            <Toaster richColors position="top-center" />

            {/* Full-screen camera container */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {/* Video */}
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

                {/* Canvas overlay for face tracking box */}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                {/* Top bar overlay */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-[#0f172a]/90 to-transparent p-3 pb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                            <span className="font-bold text-xs uppercase tracking-widest">Live Face Recognition</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400">{scanStatus}</span>
                        </div>
                    </div>
                </div>

                {/* Status badges */}
                <div className="absolute top-12 left-3 z-10 space-y-2">
                    {faceDetected && (
                        <div className="flex items-center gap-1.5 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                            Face Detected
                        </div>
                    )}
                    {location && (
                        <div className="flex items-center gap-1.5 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            GPS Ready
                        </div>
                    )}
                </div>

                {/* Stop/Start button */}
                <div className="absolute top-12 right-3 z-10">
                    {cameraActive ? (
                        <button onClick={stopCamera} className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur text-white text-xs font-bold px-3 py-2 rounded-lg border border-slate-600/50">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12" />
                            </svg>
                            Stop
                        </button>
                    ) : (
                        <button onClick={startCamera} className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12" />
                            </svg>
                            Start
                        </button>
                    )}
                </div>

                {/* Time overlay */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 text-center">
                    <div className="text-2xl font-bold font-mono tabular-nums text-white drop-shadow-lg">
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>

                {/* Bottom employee identification bar */}
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-[#0f172a]/95 via-[#0f172a]/80 to-transparent pt-12 pb-3 px-3">
                    {matchedEmployee ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                                    {capturedPhoto ? (
                                        <img src={capturedPhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{matchedEmployee.name}</p>
                                    <p className="text-[11px] text-slate-400">Matched {matchScore}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={resetScan}
                                    className="text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-600"
                                >
                                    Scan Ulang
                                </button>
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                                <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Menunggu identifikasi...</p>
                                <p className="text-[10px] text-slate-500">Arahkan wajah ke kamera</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Clock In / Clock Out buttons */}
            <div className="bg-[#0f172a] px-3 py-3 flex gap-2">
                <button
                    onClick={handleClockIn}
                    disabled={isClocking || !matchedEmployee || !location || (todayStatus?.clockIn !== null && todayStatus?.clockIn !== undefined)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-30 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isClocking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Clock In
                        </>
                    )}
                </button>
                <button
                    onClick={handleClockOut}
                    disabled={isClocking || !matchedEmployee || !location || !todayStatus?.clockIn || (todayStatus?.clockOut !== null && todayStatus?.clockOut !== undefined)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-30 bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                    {isClocking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Clock Out
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
