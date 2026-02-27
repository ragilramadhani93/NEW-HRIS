import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  outletId: string
  createdAt: string
  updatedAt: string
}

export interface Outlet {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radius: number
  workStartTime: string
  workEndTime: string
  isActive: boolean
  dailyRate?: number
  shifts: Shift[]
  _count?: { employees: number }
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string | null
  position: string
  departmentId: string | null
  department: { id: string; name: string } | null
  outletId: string | null
  outlet: Outlet | null
  shiftId: string | null
  shift: Shift | null
  faceDescriptor: string | null // stored as JSON string | null
  photoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: string
  employeeId: string
  employee: Employee
  outletId: string | null
  outlet: Outlet | null
  date: string
  clockIn: string | null
  clockOut: string | null
  clockInPhoto: string | null
  clockOutPhoto: string | null
  clockInLocation: string | null
  clockOutLocation: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  recentAttendance: Attendance[]
  weeklyData: { date: string; present: number; late: number; absent: number }[]
  departmentBreakdown: { name: string; count: number }[]
}

export interface Settings {
  companyName: string
  workStartTime: string
  workEndTime: string
  lateThreshold: number
}

interface HRISState {
  // Auth
  isAuthenticated: boolean
  adminUsername: string | null
  login: (username: string, password: string) => boolean
  logout: () => void

  // Outlets
  outlets: Outlet[]
  setOutlets: (outlets: Outlet[]) => void
  addOutlet: (outlet: Outlet) => void
  updateOutlet: (id: string, outlet: Partial<Outlet>) => void
  removeOutlet: (id: string) => void

  // Employees
  employees: Employee[]
  setEmployees: (employees: Employee[]) => void
  addEmployee: (employee: Employee) => void
  updateEmployee: (id: string, employee: Partial<Employee>) => void
  removeEmployee: (id: string) => void

  // Attendance
  attendance: Attendance[]
  setAttendance: (attendance: Attendance[]) => void
  todayAttendance: Attendance | null
  setTodayAttendance: (attendance: Attendance | null) => void

  // Dashboard
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats) => void

  // Settings
  settings: Settings
  setSettings: (settings: Settings) => void

  // UI State
  currentTab: string
  setCurrentTab: (tab: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Face Recognition
  faceDetected: boolean
  setFaceDetected: (detected: boolean) => void
  currentFaceDescriptor: number[] | null
  setCurrentFaceDescriptor: (descriptor: number[] | null) => void
  capturedPhoto: string | null
  setCapturedPhoto: (photo: string | null) => void
}

const defaultSettings: Settings = {
  companyName: 'PT. Example Company',
  workStartTime: '09:00',
  workEndTime: '17:00',
  lateThreshold: 15,
}

export const useHRISStore = create<HRISState>()(
  persist(
    (set) => ({
      // Auth
      isAuthenticated: false,
      adminUsername: null,
      login: (username: string, password: string) => {
        if (username === 'admin' && password === 'admin123') {
          set({ isAuthenticated: true, adminUsername: username })
          return true
        }
        return false
      },
      logout: () => set({ isAuthenticated: false, adminUsername: null }),

      // Outlets
      outlets: [],
      setOutlets: (outlets) => set({ outlets }),
      addOutlet: (outlet) => set((state) => ({ outlets: [...state.outlets, outlet] })),
      updateOutlet: (id, outlet) =>
        set((state) => ({
          outlets: state.outlets.map((o) => (o.id === id ? { ...o, ...outlet } : o)),
        })),
      removeOutlet: (id) => set((state) => ({ outlets: state.outlets.filter((o) => o.id !== id) })),

      // Employees
      employees: [],
      setEmployees: (employees) => set({ employees }),
      addEmployee: (employee) => set((state) => ({ employees: [...state.employees, employee] })),
      updateEmployee: (id, employee) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...employee } : e)),
        })),
      removeEmployee: (id) => set((state) => ({ employees: state.employees.filter((e) => e.id !== id) })),

      // Attendance
      attendance: [],
      setAttendance: (attendance) => set({ attendance }),
      todayAttendance: null,
      setTodayAttendance: (attendance) => set({ todayAttendance: attendance }),

      // Dashboard
      dashboardStats: null,
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      // Settings
      settings: defaultSettings,
      setSettings: (settings) => set({ settings }),

      // UI State
      currentTab: 'clock',
      setCurrentTab: (tab) => set({ currentTab: tab }),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Face Recognition
      faceDetected: false,
      setFaceDetected: (detected) => set({ faceDetected: detected }),
      currentFaceDescriptor: null,
      setCurrentFaceDescriptor: (descriptor) => set({ currentFaceDescriptor: descriptor }),
      capturedPhoto: null,
      setCapturedPhoto: (photo) => set({ capturedPhoto: photo }),
    }),
    {
      name: 'hris-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        adminUsername: state.adminUsername,
        settings: state.settings,
      }),
    }
  )
)

