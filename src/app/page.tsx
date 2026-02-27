'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useHRISStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Clock, Users, UserCheck, UserX, Building2, Settings, LogOut,
  Camera, CheckCircle, XCircle, AlertCircle, Search, Plus,
  Trash2, Edit, Download, Calendar, TrendingUp, BarChart3,
  Fingerprint, Video, VideoOff, RefreshCw, MapPin, Navigation, Banknote,
  Lock, Eye, EyeOff, FileText, Upload, Image
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts'

// Face API types
declare global {
  interface Window {
    faceapi: any // Using 'any' as type definitions are not installed via npm
  }
}

export default function HRISApp() {
  const [mounted, setMounted] = useState(false)
  const [faceApiLoaded, setFaceApiLoaded] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const { isAuthenticated } = useHRISStore()

  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
      await Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ])
      setModelsLoaded(true)
      toast.success('Face recognition models loaded')
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load face recognition models')
    }
  }, [])

  const loadFaceAPI = useCallback(async () => {
    try {
      // Load face-api.js from CDN
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js'
      script.async = true
      script.onload = async () => {
        setFaceApiLoaded(true)
        await loadModels()
      }
      document.head.appendChild(script)
    } catch (error) {
      console.error('Error loading face-api:', error)
      toast.error('Failed to load face recognition library')
    }
  }, [loadModels])

  // Mount effect - load face API on mount
  useEffect(() => {
    loadFaceAPI()
  }, [loadFaceAPI])

  // Set mounted state after initial render
  useEffect(() => {
    // Use requestAnimationFrame to defer setState outside effect
    const frame = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium text-sm">Loading HRIS System...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0f172a] transition-colors duration-200">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Tabs defaultValue="dashboard" orientation="vertical" className="flex flex-1 w-full flex-col md:flex-row">

          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10 flex-col hidden md:flex">
            <nav className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-8 pt-6 pb-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Management</p>
              </div>
              <TabsList className="flex flex-col h-auto w-full bg-transparent items-stretch gap-0.5 px-4 outline-none border-none rounded-none">
                <TabsTrigger value="clock" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <Fingerprint className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Face Registry</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="employees" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <Users className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Employees</span>
                </TabsTrigger>
                <TabsTrigger value="outlets" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Outlets</span>
                </TabsTrigger>
              </TabsList>

              <div className="px-8 pt-6 pb-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Operations</p>
              </div>
              <TabsList className="flex flex-col h-auto w-full bg-transparent items-stretch gap-0.5 px-4 outline-none border-none rounded-none">
                <TabsTrigger value="reports" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <Calendar className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Reports</span>
                </TabsTrigger>
                <TabsTrigger value="payroll" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <Banknote className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Payroll</span>
                </TabsTrigger>
                <TabsTrigger value="leave" className="flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-semibold transition-colors shadow-none border-none outline-none">
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Leave Requests</span>
                </TabsTrigger>
              </TabsList>
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <TabsList className="flex flex-col h-auto w-full bg-transparent items-stretch outline-none border-none rounded-none">
                <TabsTrigger value="settings" className="w-full flex justify-start items-center gap-3 px-4 py-2.5 h-auto rounded-lg text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 data-[state=active]:bg-indigo-600/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/10 dark:data-[state=active]:text-indigo-400 font-medium transition-colors shadow-none border-none outline-none">
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full">
            <div className="p-6 space-y-6">
              <TabsContent value="clock" className="m-0 focus-visible:outline-none">
                <ClockTab faceApiLoaded={faceApiLoaded && modelsLoaded} />
              </TabsContent>
              <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
                <DashboardTab />
              </TabsContent>
              <TabsContent value="employees" className="m-0 focus-visible:outline-none">
                <EmployeesTab faceApiLoaded={faceApiLoaded && modelsLoaded} />
              </TabsContent>
              <TabsContent value="outlets" className="m-0 focus-visible:outline-none">
                <OutletsTab />
              </TabsContent>
              <TabsContent value="reports" className="m-0 focus-visible:outline-none">
                <ReportsTab />
              </TabsContent>
              <TabsContent value="payroll" className="m-0 focus-visible:outline-none">
                <PayrollTab />
              </TabsContent>
              <TabsContent value="leave" className="m-0 focus-visible:outline-none">
                <LeaveRequestsTab />
              </TabsContent>
              <TabsContent value="settings" className="m-0 focus-visible:outline-none">
                <SettingsTab />
              </TabsContent>
            </div>
          </main>

        </Tabs>
      </div>
    </div>
  )
}

// Header Component
function Header() {
  const { settings, logout, adminUsername } = useHRISStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">{settings.companyName}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Enterprise HR Management</p>
          </div>
        </div>
        <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-1.5 border border-transparent focus-within:border-indigo-600/30 transition-all">
          <Search className="h-4 w-4 text-slate-400" />
          <input className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-64 placeholder:text-slate-400 ml-2" placeholder="Search employees, records..." type="text" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden sm:block text-right">
          <div className="text-lg font-bold font-mono tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
          <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-600/10">
            {(adminUsername || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

// Login Page Component
function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, settings } = useHRISStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    setTimeout(() => {
      const success = login(username, password)
      if (!success) {
        setError('Invalid username or password')
      }
      setIsSubmitting(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0f172a] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{settings.companyName}</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise HR Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Sign in</h2>
            <p className="text-sm text-slate-400 mt-1">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors placeholder:text-slate-400"
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors placeholder:text-slate-400 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2.5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !username || !password}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} {settings.companyName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}

// Clock In/Out Tab
function ClockTab({ faceApiLoaded }: { faceApiLoaded: boolean }) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [detectedFace, setDetectedFace] = useState(false)
  const [identifiedEmployee, setIdentifiedEmployee] = useState<{ employeeId: string; name: string; confidence: number } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [todayStatus, setTodayStatus] = useState<{ clockIn: string | null; clockOut: string | null; status: string } | null>(null)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraActiveRef = useRef(false)
  const { employees, todayAttendance, settings } = useHRISStore()

  // GPS detection when camera starts
  useEffect(() => {
    if (isCameraActive) {
      setGpsStatus('detecting')
      setGpsError(null)
      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setGpsLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
            setGpsStatus('success')
          },
          (error) => {
            setGpsStatus('error')
            setGpsError(error.code === 1 ? 'Location permission denied' : 'Cannot get location')
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        )
        return () => navigator.geolocation.clearWatch(watchId)
      } else {
        setGpsStatus('error')
        setGpsError('Geolocation not supported')
      }
    } else {
      setGpsLocation(null)
      setGpsStatus('idle')
      setGpsError(null)
    }
  }, [isCameraActive])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchTodayStatus()
  }, [])

  const fetchTodayStatus = async () => {
    try {
      const response = await fetch('/api/attendance/today')
      if (response.ok) {
        const data = await response.json()
        // API returns an array of all today's attendance records
        const records = Array.isArray(data) ? data : (data ? [data] : [])
        useHRISStore.getState().setTodayAttendance(records as any)

        // Find attendance record for the currently identified employee
        if (identifiedEmployee && records.length > 0) {
          const myRecord = records.find(
            (r: { employeeId: string }) => r.employeeId === identifiedEmployee.employeeId
          )
          if (myRecord) {
            setTodayStatus({
              clockIn: myRecord.clockIn,
              clockOut: myRecord.clockOut,
              status: myRecord.status
            })
            return
          }
        }

        // If no specific employee match, check if there's only one record
        if (records.length === 1) {
          setTodayStatus({
            clockIn: records[0].clockIn,
            clockOut: records[0].clockOut,
            status: records[0].status
          })
        }
      }
    } catch (error) {
      console.error('Error fetching today status:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        cameraActiveRef.current = true
        setIsCameraActive(true)
        startFaceDetection()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    cameraActiveRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setDetectedFace(false)
    setIdentifiedEmployee(null)
  }

  const startFaceDetection = async () => {
    if (!faceApiLoaded || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    const detectFace = async () => {
      // Use ref instead of state to avoid stale closure
      if (!cameraActiveRef.current) return
      if (video.paused || video.ended || video.readyState < 2) {
        requestAnimationFrame(detectFace)
        return
      }

      try {
        const detections = await window.faceapi.detectAllFaces(
          video,
          new window.faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceDescriptors()

        // Clear canvas
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }

        if (detections.length > 0) {
          setDetectedFace(true)

          // Draw detection box
          const detection = detections[0]
          const box = detection.detection.box
          if (ctx) {
            ctx.strokeStyle = '#00ff00'
            ctx.lineWidth = 3
            ctx.strokeRect(box.x, box.y, box.width, box.height)
          }

          // Match face with registered employees
          if (employees.length > 0) {
            let bestMatch: { employeeId: string; name: string; confidence: number } | null = null
            let bestDistance = 0.6 // Threshold

            for (const employee of employees) {
              if (employee.faceDescriptor) {
                try {
                  const storedDescriptor = JSON.parse(employee.faceDescriptor)
                  const distance = window.faceapi.euclideanDistance(
                    detection.descriptor,
                    storedDescriptor
                  )

                  if (distance < bestDistance) {
                    bestDistance = distance
                    bestMatch = {
                      employeeId: employee.id,
                      name: employee.name,
                      confidence: Math.round((1 - distance) * 100)
                    }
                  }
                } catch (e) {
                  console.error('Error parsing face descriptor:', e)
                }
              }
            }

            setIdentifiedEmployee(bestMatch)
          }
        } else {
          setDetectedFace(false)
          setIdentifiedEmployee(null)
        }
      } catch (error) {
        console.error('Face detection error:', error)
      }

      // Continue the detection loop using ref
      if (cameraActiveRef.current) {
        requestAnimationFrame(detectFace)
      }
    }

    video.addEventListener('play', detectFace)
  }

  const handleClockIn = async () => {
    if (!identifiedEmployee) {
      toast.error('No face identified. Please register your face first.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: identifiedEmployee.employeeId,
          location: gpsLocation,
          settings: settings
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Clock in successful! Welcome, ${identifiedEmployee.name}`)
        setTodayStatus({ clockIn: data.clockIn, clockOut: null, status: data.status })
        fetchTodayStatus()
      } else {
        toast.error(data.error || 'Failed to clock in')
      }
    } catch (error) {
      toast.error('Failed to clock in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!identifiedEmployee) {
      toast.error('No face identified')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: identifiedEmployee.employeeId,
          location: gpsLocation,
          settings: settings
        })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(`Clock out successful! Goodbye, ${identifiedEmployee.name}`)
        setTodayStatus(prev => prev ? { ...prev, clockOut: data.clockOut, status: data.status } : null)
        fetchTodayStatus()
      } else {
        toast.error(data.error || 'Failed to clock out')
      }
    } catch (error) {
      toast.error('Failed to clock out')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Camera + Activities - 2 columns */}
      <div className="xl:col-span-2 space-y-6">
        {/* Camera / Live Monitoring Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900 flex justify-between items-center">
            <h4 className="text-white text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              LIVE FACE RECOGNITION
            </h4>
            <span className="text-white/60 text-[10px]">
              {faceApiLoaded ? 'System Ready' : 'Loading Models...'}
            </span>
          </div>
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
            />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <VideoOff className="h-12 w-12 text-white" />
                </div>
                {/* Scan frame corners */}
                <div className="absolute inset-0 border border-indigo-600/40 m-6 rounded-lg pointer-events-none">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-indigo-600"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-indigo-600"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-indigo-600"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-indigo-600"></div>
                </div>
              </div>
            )}

            {/* Face detection status overlay */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <Badge variant={detectedFace ? "default" : "destructive"} className="bg-green-500">
                    {detectedFace ? 'Face Detected' : 'No Face'}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      gpsStatus === 'success' && 'bg-blue-500 text-white',
                      gpsStatus === 'detecting' && 'bg-yellow-500 text-black',
                      gpsStatus === 'error' && 'bg-red-500 text-white'
                    )}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    {gpsStatus === 'detecting' && 'Getting GPS...'}
                    {gpsStatus === 'success' && `GPS Ready`}
                    {gpsStatus === 'error' && (gpsError || 'GPS Error')}
                  </Badge>
                </div>
                <Button size="sm" variant="secondary" onClick={stopCamera}>
                  <VideoOff className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            )}

            {/* Identified employee overlay */}
            {identifiedEmployee && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white leading-tight">{identifiedEmployee.name}</p>
                  <p className="text-[9px] text-white/70">Matched {identifiedEmployee.confidence}%</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
            )}
          </div>
          <div className="p-4 flex gap-2">
            {!isCameraActive ? (
              <Button onClick={startCamera} disabled={!faceApiLoaded} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg font-bold border-0">
                <Video className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg font-bold border-0"
                  onClick={handleClockIn}
                  disabled={!detectedFace || !identifiedEmployee || isLoading || !!todayStatus?.clockIn}
                >
                  <LogOut className="h-4 w-4 mr-2 rotate-180" />
                  Clock In
                </Button>
                <Button
                  className="flex-1 text-xs py-2 rounded-lg font-bold"
                  onClick={handleClockOut}
                  disabled={!detectedFace || !identifiedEmployee || isLoading || !todayStatus?.clockIn || !!todayStatus?.clockOut}
                  variant="secondary"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Status cards */}
      <div className="space-y-6">
        {/* Today's Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            Today&apos;s Status
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Clock In</p>
              </div>
              <p className="text-sm font-mono font-bold">{todayStatus?.clockIn || '--:--:--'}</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Clock Out</p>
              </div>
              <p className="text-sm font-mono font-bold">{todayStatus?.clockOut || '--:--:--'}</p>
            </div>
            {todayStatus && (
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  todayStatus.status === 'PRESENT' && 'text-green-600 bg-green-50',
                  todayStatus.status === 'LATE' && 'text-orange-600 bg-orange-50',
                  todayStatus.status !== 'PRESENT' && todayStatus.status !== 'LATE' && 'text-blue-600 bg-blue-50'
                )}>
                  {todayStatus.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Active Shifts / Work Schedule */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold mb-4 text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Work Schedule
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Start Time</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{settings.workStartTime}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">End Time</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{settings.workEndTime}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Late Threshold</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{settings.lateThreshold} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold mb-4 text-sm">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Employees</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{employees.filter(e => e.isActive).length}</span>
                <span className="text-slate-400 text-sm mb-1">/ {employees.length} total</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${employees.length > 0 ? (employees.filter(e => e.isActive).length / employees.length) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Face Registered</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{employees.filter(e => e.faceDescriptor).length}</span>
                <span className="text-slate-400 text-sm mb-1">/ {employees.length} total</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${employees.length > 0 ? (employees.filter(e => e.faceDescriptor).length / employees.length) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dashboard Tab
function DashboardTab() {
  const { dashboardStats, setDashboardStats, settings } = useHRISStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const chartConfig = {
    present: { label: "Present", color: "#22c55e" },
    late: { label: "Late", color: "#ef4444" },
    absent: { label: "Absent", color: "#6b7280" },
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{dashboardStats?.totalEmployees || 0}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{dashboardStats?.presentToday || 0}</span>
            <span className="text-slate-400 text-sm mb-1">/ {dashboardStats?.totalEmployees || 0} total</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${dashboardStats?.totalEmployees ? ((dashboardStats?.presentToday || 0) / dashboardStats.totalEmployees) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Today</span>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Alert</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{dashboardStats?.lateToday || 0}</span>
            <span className="text-slate-400 text-sm mb-1">this morning</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${dashboardStats?.totalEmployees ? ((dashboardStats?.lateToday || 0) / dashboardStats.totalEmployees) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent Today</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{dashboardStats?.absentToday || 0}</span>
            <span className="text-slate-400 text-sm mb-1">on leave</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${dashboardStats?.totalEmployees ? ((dashboardStats?.absentToday || 0) / dashboardStats.totalEmployees) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Weekly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats?.weeklyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { weekday: 'short' })}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="present" fill="#22c55e" name="Present" />
                  <Bar dataKey="late" fill="#ef4444" name="Late" />
                  <Bar dataKey="absent" fill="#6b7280" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats?.departmentBreakdown?.map((dept, index) => (
                <div key={dept.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{dept.name}</span>
                    <span className="text-sm text-slate-500">{dept.count} employees</span>
                  </div>
                  <Progress
                    value={(dept.count / (dashboardStats?.totalEmployees || 1)) * 100}
                    className="h-2"
                  />
                </div>
              ))}
              {(!dashboardStats?.departmentBreakdown || dashboardStats.departmentBreakdown.length === 0) && (
                <p className="text-center text-slate-500 py-8">No departments created yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboardStats?.recentAttendance?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employee?.name}</TableCell>
                  <TableCell>{record.employee?.department?.name || '-'}</TableCell>
                  <TableCell>{new Date(record.date).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{record.clockIn || '-'}</TableCell>
                  <TableCell>{record.clockOut || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'PRESENT' ? 'default' : record.status === 'LATE' ? 'destructive' : 'secondary'}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(!dashboardStats?.recentAttendance || dashboardStats.recentAttendance.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No recent attendance records
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Employees Tab
function EmployeesTab({ faceApiLoaded }: { faceApiLoaded: boolean }) {
  const { employees, setEmployees, removeEmployee } = useHRISStore()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<{ id: string; employeeId: string; name: string; email: string; phone: string; position: string; departmentId: string; outletId?: string; shiftId?: string } | null>(null)
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [outlets, setLocalOutlets] = useState<{ id: string; name: string; shifts?: any[] }[]>([])

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    fetchOutlets()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/seed')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/outlets')
      if (response.ok) {
        const data = await response.json()
        setLocalOutlets(data)
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      if (response.ok) {
        removeEmployee(id)
        toast.success('Employee deleted successfully')
      } else {
        toast.error('Failed to delete employee')
      }
    } catch (error) {
      toast.error('Failed to delete employee')
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <EmployeeFormDialog
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setEditingEmployee(null) }}
          onSuccess={() => { fetchEmployees(); setIsDialogOpen(false); setEditingEmployee(null) }}
          departments={departments}
          outlets={outlets}
          faceApiLoaded={faceApiLoaded}
          editingEmployee={editingEmployee}
        />
        <Button onClick={() => setIsDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Face Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-mono">{employee.employeeId}</TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department?.name || '-'}</TableCell>
                    <TableCell>{employee.outlet?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.faceDescriptor ? 'default' : 'secondary'}>
                        {employee.faceDescriptor ? 'Registered' : 'Not Registered'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? 'default' : 'destructive'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingEmployee({
                              id: employee.id,
                              employeeId: employee.employeeId,
                              name: employee.name,
                              email: employee.email,
                              phone: employee.phone || '',
                              position: employee.position,
                              departmentId: employee.departmentId || '',
                              outletId: employee.outletId || '',
                              shiftId: employee.shiftId || ''
                            })
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {employee.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(employee.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Employee Form Dialog
function EmployeeFormDialog({
  isOpen,
  onClose,
  onSuccess,
  departments,
  outlets,
  faceApiLoaded,
  editingEmployee
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  departments: { id: string; name: string }[]
  outlets: { id: string; name: string; shifts?: { id: string; name: string; startTime: string; endTime: string }[] }[]
  faceApiLoaded: boolean
  editingEmployee: { id: string; employeeId: string; name: string; email: string; phone: string; position: string; departmentId: string; outletId?: string; shiftId?: string } | null
}) {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    departmentId: '',
    outletId: '',
    shiftId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFaceCapture, setShowFaceCapture] = useState(false)
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        employeeId: editingEmployee.employeeId || '',
        name: editingEmployee.name || '',
        email: editingEmployee.email || '',
        phone: editingEmployee.phone || '',
        position: editingEmployee.position || '',
        departmentId: editingEmployee.departmentId || '',
        outletId: editingEmployee.outletId || '',
        shiftId: editingEmployee.shiftId || ''
      })
    } else {
      setFormData({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        position: '',
        departmentId: '',
        outletId: '',
        shiftId: ''
      })
    }
  }, [editingEmployee, isOpen])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setShowFaceCapture(true)
      }
    } catch (error) {
      toast.error('Could not access camera')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowFaceCapture(false)
  }

  const captureFace = async () => {
    if (!faceApiLoaded || !videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = 640
      canvas.height = 480

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480)
        const photoData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedPhoto(photoData)
      }

      const detection = await window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (detection) {
        setFaceDescriptor(Array.from(detection.descriptor))
        toast.success('Face captured successfully!')
        stopCamera()
      } else {
        toast.error('No face detected. Please try again.')
      }
    } catch (error) {
      console.error('Error capturing face:', error)
      toast.error('Failed to capture face')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log("Submitting employee form...")

    // Abort controller with 30s timeout to prevent indefinite hang
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      if (editingEmployee) {
        // Update existing employee
        const response = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          signal: controller.signal
        })
        if (response.ok) {
          toast.success('Employee updated successfully')
          onSuccess()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update employee')
        }
      } else {
        // Create new employee
        console.log("Sending POST request to /api/employees")
        const payload = {
          ...formData,
          faceDescriptor: faceDescriptor ? JSON.stringify(faceDescriptor) : undefined,
          photo: capturedPhoto
        }
        console.log("Payload size approx:", JSON.stringify(payload).length)

        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        })

        console.log("Response status:", response.status)

        if (response.ok) {
          console.log("Response OK")
          toast.success('Employee created successfully')
          onSuccess()
        } else {
          console.log("Response NOT OK")
          const error = await response.json()
          console.error("Server error:", error)
          toast.error(error.details || error.error || 'Failed to create employee')
        }
      }
    } catch (error) {
      console.error("HandleSubmit error:", error)
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error('An error occurred. Check your connection.')
      }
    } finally {
      clearTimeout(timeoutId)
      console.log("Setting isSubmitting false")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="EMP001"
                required
                disabled={!!editingEmployee}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62 812-xxxx-xxxx"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Software Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Outlet</Label>
              <Select
                value={formData.outletId}
                onValueChange={(value) => setFormData({ ...formData, outletId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.outletId && (
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={formData.shiftId}
                  onValueChange={(value) => setFormData({ ...formData, shiftId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.find(o => o.id === formData.outletId)?.shifts?.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </SelectItem>
                    ))}
                    {!outlets.find(o => o.id === formData.outletId)?.shifts?.length && (
                      <div className="p-2 text-sm text-slate-500 text-center">No shifts available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Face Registration Section */}
          {!editingEmployee && (
            <div className="space-y-4">
              <Label>Face Registration</Label>
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn("w-full h-full object-cover transform scale-x-[-1]", !showFaceCapture && "hidden")}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!showFaceCapture && !faceDescriptor && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-12 w-12 text-slate-400 mb-2" />
                        <p className="text-slate-500 text-sm">Click below to capture face</p>
                      </>
                    )}
                  </div>
                )}

                {showFaceCapture && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <Button type="button" onClick={captureFace}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Face
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!showFaceCapture && !faceDescriptor && (
                  <Button type="button" variant="outline" onClick={startCamera} disabled={!faceApiLoaded}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                {showFaceCapture && (
                  <Button type="button" variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                )}
                {faceDescriptor && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Face registered</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingEmployee ? 'Update' : 'Create Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Utility function for className
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
// Outlets Tab
function OutletsTab() {
  const { outlets, setOutlets, addOutlet, updateOutlet, removeOutlet } = useHRISStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<{ id: string; name: string; address: string; latitude: number; longitude: number; radius: number; dailyRate: number; workStartTime: string; workEndTime: string; isActive: boolean; shifts?: any[] } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '100',
    dailyRate: '',
    workStartTime: '09:00',
    workEndTime: '17:00',
    isActive: true,
    shifts: [] as { id?: string; name: string; startTime: string; endTime: string }[]
  })

  const handleAddShift = () => {
    if (formData.shifts.length >= 4) {
      toast.error('Maximum 4 shifts allowed')
      return
    }
    setFormData({
      ...formData,
      shifts: [...formData.shifts, { name: `Shift ${formData.shifts.length + 1}`, startTime: '09:00', endTime: '17:00' }]
    })
  }

  const handleRemoveShift = (index: number) => {
    const newShifts = [...formData.shifts]
    newShifts.splice(index, 1)
    setFormData({ ...formData, shifts: newShifts })
  }

  const handleShiftChange = (index: number, field: string, value: string) => {
    const newShifts = [...formData.shifts]
    newShifts[index] = { ...newShifts[index], [field]: value }
    setFormData({ ...formData, shifts: newShifts })
  }
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchOutlets()
  }, [])

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/outlets')
      if (response.ok) {
        const data = await response.json()
        setOutlets(data)
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/outlets/${id}`, { method: 'DELETE' })
      if (response.ok) {
        removeOutlet(id)
        toast.success(`Outlet ${name} deleted successfully`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete outlet')
      }
    } catch (error) {
      toast.error('Failed to delete outlet')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingOutlet ? `/api/outlets/${editingOutlet.id}` : '/api/outlets'
      const method = editingOutlet ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        if (editingOutlet) {
          updateOutlet(editingOutlet.id, data)
          toast.success('Outlet updated successfully')
        } else {
          addOutlet(data)
          toast.success('Outlet created successfully')
        }
        setIsDialogOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Failed to save outlet')
      }
    } catch (error) {
      toast.error('Failed to save outlet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingOutlet(null)
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: '100',
      dailyRate: '',
      workStartTime: '09:00',
      workEndTime: '17:00',
      isActive: true,
      shifts: []
    })
  }

  const handleEdit = (outlet: any) => {
    setEditingOutlet(outlet)
    setFormData({
      name: outlet.name,
      address: outlet.address || '',
      latitude: outlet.latitude.toString(),
      longitude: outlet.longitude.toString(),
      radius: outlet.radius.toString(),
      dailyRate: outlet.dailyRate ? outlet.dailyRate.toString() : '',
      workStartTime: outlet.workStartTime,
      workEndTime: outlet.workEndTime,
      isActive: outlet.isActive,
      shifts: outlet.shifts ? outlet.shifts.map((s: any) => ({ id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime })) : []
    })
    setIsDialogOpen(true)
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success('Location retrieved')
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message)
        }
      )
    } else {
      toast.error('Geolocation not supported')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Outlets</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Outlet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOutlet ? 'Edit Outlet' : 'Add New Outlet'}</DialogTitle>
              <CardDescription>Configure outlet location and schedule</CardDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Outlet Name</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(val) => setFormData({ ...formData, isActive: val === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Rate (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.dailyRate}
                    onChange={e => setFormData({ ...formData, dailyRate: e.target.value })}
                    placeholder="e.g. 100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number" step="any"
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number" step="any"
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Use My Current Location
              </Button>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Radius (meters)</Label>
                  <Input
                    type="number"
                    value={formData.radius}
                    onChange={e => setFormData({ ...formData, radius: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Start Time</Label>
                  <Input
                    type="time"
                    value={formData.workStartTime}
                    onChange={e => setFormData({ ...formData, workStartTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default End Time</Label>
                  <Input
                    type="time"
                    value={formData.workEndTime}
                    onChange={e => setFormData({ ...formData, workEndTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label>Shifts (Max 4)</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddShift} disabled={formData.shifts.length >= 4}>
                    <Plus className="h-4 w-4 mr-2" /> Add Shift
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.shifts.map((shift, index) => (
                    <div key={index} className="flex gap-2 items-end border p-2 rounded-md bg-slate-50 dark:bg-slate-900">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={shift.name}
                          onChange={(e) => handleShiftChange(index, 'name', e.target.value)}
                          placeholder="Shift Name"
                          className="h-8"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Start</Label>
                        <Input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">End</Label>
                        <Input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleRemoveShift(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.shifts.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">No specific shifts configured. Default time will be used.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingOutlet ? 'Update' : 'Create Outlet'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {outlets.map((outlet) => (
          <Card key={outlet.id} className={cn(!outlet.isActive && "opacity-60")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {outlet.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => handleEdit(outlet)}>
                  <Edit className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Outlet</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {outlet.name}? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-500" onClick={() => handleDelete(outlet.id, outlet.name)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-500" />
                {(outlet._count as any)?.employees || 0} Employees
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {outlet.address || 'No address'}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Working Hours:</span>
                  <span>{outlet.workStartTime} - {outlet.workEndTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Radius:</span>
                  <span>{outlet.radius}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Rate:</span>
                  <span>Rp {outlet.dailyRate?.toLocaleString('id-ID') || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge variant={outlet.isActive ? 'outline' : 'secondary'}>{outlet.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {outlets.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-slate-500 border rounded-lg border-dashed">
            No outlets found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}

// Reports Tab
interface AttendanceRecord {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  employee: {
    employeeId: string
    name: string
    department?: { name: string } | null
  }
}

function ReportsTab() {
  const { outlets, setOutlets } = useHRISStore()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [outletId, setOutletId] = useState('all')
  const [reportData, setReportData] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchOutlets()
  }, [])

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/outlets')
      if (response.ok) {
        const data = await response.json()
        setOutlets(data)
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    }
  }

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/attendance/report?startDate=${startDate}&endDate=${endDate}&outletId=${outletId}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (reportData.length === 0) return

    const headers = ['Date', 'Employee ID', 'Name', 'Department', 'Clock In', 'Clock Out', 'Status']
    const rows = reportData.map((record) => [
      record.date,
      record.employee?.employeeId,
      record.employee?.name,
      record.employee?.department?.name || '-',
      record.clockIn || '-',
      record.clockOut || '-',
      record.status
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select date range to generate attendance report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Outlet</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Outlets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateReport} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Generate
              </Button>
              <Button variant="outline" onClick={exportToCSV} disabled={reportData.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Report</CardTitle>
          <CardDescription>
            {reportData.length > 0 ? `${reportData.length} records found` : 'No data to display'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Select date range and click Generate to view report
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell className="font-medium">{record.employee?.name}</TableCell>
                    <TableCell>{record.employee?.department?.name || '-'}</TableCell>
                    <TableCell>{record.clockIn || '-'}</TableCell>
                    <TableCell>{record.clockOut || '-'}</TableCell>
                    <TableCell>
                      {record.clockIn && record.clockOut
                        ? calculateDuration(record.clockIn, record.clockOut)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'PRESENT' ? 'default' : record.status === 'LATE' ? 'destructive' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Calculate duration between two times
function calculateDuration(clockIn: string, clockOut: string): string {
  const [inH, inM, inS] = clockIn.split(':').map(Number)
  const [outH, outM, outS] = clockOut.split(':').map(Number)

  const inSeconds = inH * 3600 + inM * 60 + inS
  const outSeconds = outH * 3600 + outM * 60 + outS

  const diff = outSeconds - inSeconds
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)

  return `${hours}h ${minutes}m`
}

// Payroll Tab
interface PayrollIncentive {
  id: string
  name: string
  amount: number
  type: string
}

interface PayrollRecord {
  id: string
  employeeId: string
  name: string
  department: string
  outletName: string
  dailyRate: number
  presentDays: number
  basicSalary: number
  additions: number
  deductions: number
  totalPay: number
  incentives: PayrollIncentive[]
}

function PayrollTab() {
  const { outlets } = useHRISStore()
  const [employees, setEmployees] = useState<{ id: string, name: string }[]>([])
  const [month, setMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
  })
  const [outletId, setOutletId] = useState('all')
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Incentive Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmittingIncentive, setIsSubmittingIncentive] = useState(false)
  const [incentiveForm, setIncentiveForm] = useState({
    employeeId: '',
    name: '',
    amount: '',
    type: 'ADDITION'
  })

  useEffect(() => {
    // Fetch basic employee list for the incentive dialog dropdown
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees')
        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
      }
    }
    fetchEmployees()
  }, [])

  const generatePayroll = async () => {
    if (!month) {
      toast.error('Please select a month')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/payroll?month=${month}&outletId=${outletId}`)
      if (response.ok) {
        const data = await response.json()
        setPayrollData(data)
      } else {
        toast.error('Failed to generate payroll data')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate payroll data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (payrollData.length === 0) return

    const headers = ['Employee ID', 'Name', 'Department', 'Outlet', 'Daily Rate', 'Days Present', 'Basic Salary', 'Total Additions', 'Total Deductions', 'Total Pay']
    const rows = payrollData.map((record) => [
      record.employeeId,
      record.name,
      record.department,
      record.outletName,
      record.dailyRate,
      record.presentDays,
      record.basicSalary,
      record.additions,
      record.deductions,
      record.totalPay
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-report-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddIncentive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incentiveForm.employeeId || !incentiveForm.name || !incentiveForm.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmittingIncentive(true)
    try {
      const response = await fetch('/api/payroll/incentive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...incentiveForm,
          date: month
        })
      })

      if (response.ok) {
        toast.success('Incentive added successfully')
        setIsDialogOpen(false)
        setIncentiveForm({ employeeId: '', name: '', amount: '', type: 'ADDITION' })
        generatePayroll() // Refresh data
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to add incentive')
      }
    } catch (error) {
      toast.error('Failed to add incentive')
    } finally {
      setIsSubmittingIncentive(false)
    }
  }

  const handleDeleteIncentive = async (id: string) => {
    try {
      const response = await fetch(`/api/payroll/incentive/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Incentive deleted successfully')
        generatePayroll() // Refresh data
      } else {
        toast.error('Failed to delete incentive')
      }
    } catch (error) {
      toast.error('Failed to delete incentive')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payroll Management</CardTitle>
              <CardDescription>Generate monthly payroll reports based on attendance and daily rates.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Incentive / Deduction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Incentive or Deduction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddIncentive} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select
                      value={incentiveForm.employeeId}
                      onValueChange={(val) => setIncentiveForm({ ...incentiveForm, employeeId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={incentiveForm.type}
                      onValueChange={(val) => setIncentiveForm({ ...incentiveForm, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADDITION">Addition (Bonus, Allowance, etc)</SelectItem>
                        <SelectItem value="DEDUCTION">Deduction (Kasbon, Penalty, etc)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Bonus Target, Kasbon"
                      value={incentiveForm.name}
                      onChange={(e) => setIncentiveForm({ ...incentiveForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={incentiveForm.amount}
                      onChange={(e) => setIncentiveForm({ ...incentiveForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmittingIncentive}>
                      {isSubmittingIncentive ? 'Saving...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label>Month / Year</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Outlet</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Outlets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generatePayroll} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Generate
              </Button>
              <Button variant="outline" onClick={exportToCSV} disabled={payrollData.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Report</CardTitle>
          <CardDescription>
            {payrollData.length > 0 ? `${payrollData.length} employees calculated` : 'No data to display'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Days Present</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Additions</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Select month and click Generate to view payroll
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-xs text-slate-500">{record.employeeId}</p>
                      </TableCell>
                      <TableCell>
                        <p>{record.outletName}</p>
                        <p className="text-xs text-slate-500">Rate: Rp {record.dailyRate.toLocaleString('id-ID')}</p>
                      </TableCell>
                      <TableCell>{record.presentDays} days</TableCell>
                      <TableCell>Rp {record.basicSalary.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-green-600">Rp {record.additions.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-red-600">Rp {record.deductions.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="font-bold">Rp {record.totalPay.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">Details</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Payroll Details - {record.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex justify-between border-b pb-2">
                                <span>Basic Salary ({record.presentDays} days x Rp {record.dailyRate.toLocaleString('id-ID')})</span>
                                <span>Rp {record.basicSalary.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-slate-500">Additions & Deductions</h4>
                                {record.incentives.length === 0 ? (
                                  <p className="text-sm text-slate-500 italic">None recorded this month.</p>
                                ) : (
                                  record.incentives.map((inc) => (
                                    <div key={inc.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded text-sm">
                                      <span>{inc.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={inc.type === 'ADDITION' ? 'text-green-600' : 'text-red-600'}>
                                          {inc.type === 'ADDITION' ? '+' : '-'} Rp {inc.amount.toLocaleString('id-ID')}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteIncentive(inc.id)}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="flex justify-between border-t pt-2 font-bold text-lg">
                                <span>Total Take Home Pay</span>
                                <span>Rp {record.totalPay.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Settings Tab
function SettingsTab() {
  const { settings, setSettings } = useHRISStore()
  const [formData, setFormData] = useState(settings)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        toast.success('Settings saved successfully')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Company Settings
          </CardTitle>
          <CardDescription>Configure your company work hours and attendance rules</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="PT. Example Company"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workStartTime">Work Start Time</Label>
                <Input
                  id="workStartTime"
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEndTime">Work End Time</Label>
                <Input
                  id="workEndTime"
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
              <Input
                id="lateThreshold"
                type="number"
                value={formData.lateThreshold}
                onChange={(e) => setFormData({ ...formData, lateThreshold: parseInt(e.target.value) })}
                min={0}
                max={60}
              />
              <p className="text-sm text-slate-500">
                Employees arriving after this many minutes past start time will be marked as late
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Face Recognition</span>
            <span className="font-medium">face-api.js</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Framework</span>
            <span className="font-medium">Next.js 15</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Leave Requests Tab
function LeaveRequestsTab() {
  const { employees } = useHRISStore()
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'IZIN' as 'IZIN' | 'SAKIT',
    startDate: '',
    endDate: '',
    reason: '',
    evidence: '' as string,
    evidenceName: ''
  })

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leave-requests')
      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        evidence: reader.result as string,
        evidenceName: file.name
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        toast.success('Leave request submitted')
        setIsDialogOpen(false)
        setFormData({ employeeId: '', type: 'IZIN', startDate: '', endDate: '', reason: '', evidence: '', evidenceName: '' })
        fetchLeaveRequests()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit')
      }
    } catch (error) {
      toast.error('Failed to submit leave request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        toast.success(`Request ${status.toLowerCase()}`)
        fetchLeaveRequests()
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Request deleted')
        fetchLeaveRequests()
      }
    } catch (error) {
      toast.error('Failed to delete request')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Leave Requests</h2>
          <p className="text-sm text-slate-400 mt-1">Manage izin and sakit requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</Label>
                <Select value={formData.employeeId} onValueChange={(v) => setFormData(prev => ({ ...prev, employeeId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.isActive).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name} - {emp.position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as 'IZIN' | 'SAKIT' }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IZIN">Izin (Leave)</SelectItem>
                    <SelectItem value="SAKIT">Sakit (Sick)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="mt-1" required />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="mt-1" required />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</Label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 min-h-[80px] resize-none"
                  placeholder="Describe your reason..."
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evidence (Optional)</Label>
                <div className="mt-1">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-600/50 transition-colors">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {formData.evidenceName || 'Upload image or document (max 5MB)'}
                    </span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                  </label>
                  {formData.evidence && formData.evidence.startsWith('data:image') && (
                    <div className="mt-2 relative">
                      <img src={formData.evidence} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, evidence: '', evidenceName: '' }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-orange-500">{leaveRequests.filter(r => r.status === 'PENDING').length}</span>
            <span className="text-slate-400 text-sm mb-1">requests</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${leaveRequests.length > 0 ? (leaveRequests.filter(r => r.status === 'PENDING').length / leaveRequests.length) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-green-500">{leaveRequests.filter(r => r.status === 'APPROVED').length}</span>
            <span className="text-slate-400 text-sm mb-1">requests</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${leaveRequests.length > 0 ? (leaveRequests.filter(r => r.status === 'APPROVED').length / leaveRequests.length) * 100 : 0}%` }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-red-500">{leaveRequests.filter(r => r.status === 'REJECTED').length}</span>
            <span className="text-slate-400 text-sm mb-1">requests</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: `${leaveRequests.length > 0 ? (leaveRequests.filter(r => r.status === 'REJECTED').length / leaveRequests.length) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Employee</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Type</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Date Range</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaveRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No leave requests yet</p>
                  <p className="text-xs mt-1">Click "New Request" to submit one</p>
                </TableCell>
              </TableRow>
            ) : (
              leaveRequests.map((req) => (
                <TableRow key={req.id} className="border-slate-200 dark:border-slate-700">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{req.employee?.name}</p>
                      <p className="text-xs text-slate-400">{req.employee?.position}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${req.type === 'SAKIT' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                      {req.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {req.startDate} — {req.endDate}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell>
                    {req.evidence ? (
                      <button
                        onClick={() => setEvidencePreview(req.evidence)}
                        className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Image className="h-3 w-3" />
                        View
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                        req.status === 'APPROVED' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                          'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {req.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(req.id, 'APPROVED')}>
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(req.id, 'REJECTED')}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Evidence Preview Dialog */}
      <Dialog open={!!evidencePreview} onOpenChange={() => setEvidencePreview(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Evidence</DialogTitle>
          </DialogHeader>
          {evidencePreview && (
            <div className="w-full">
              {evidencePreview.startsWith('data:image') ? (
                <img src={evidencePreview} alt="Evidence" className="w-full rounded-lg" />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <a href={evidencePreview} download className="text-indigo-600 font-bold text-sm hover:underline">Download File</a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
