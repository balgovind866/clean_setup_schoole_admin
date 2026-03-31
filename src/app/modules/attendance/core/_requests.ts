import axios from 'axios'
import {
    StudentAttendanceFetchResponse,
    MarkStudentAttendancePayload,
    StaffAttendanceFetchResponse,
    MarkStaffAttendancePayload,
    ClassMonthlyMatrixResponse,
    StudentMonthlyReportResponse
} from './_models'

const API_URL = import.meta.env.VITE_APP_API_URL

// 1. Daily Attendance Register Fetch (GET)
// curl --location 'http://localhost:3000/api/school/30/attendance/students?class_section_id=1&date=2024-04-10'
export function getStudentAttendance(schoolId: string | number, classSectionId: string | number, date: string) {
    return axios.get<StudentAttendanceFetchResponse>(`${API_URL}/school/${schoolId}/attendance/students`, {
        params: { class_section_id: classSectionId, date }
    })
}

// 2. Manual Attendance Submit/Update (POST)
// curl --location 'http://localhost:3000/api/school/30/attendance/students/mark'
export function markStudentAttendance(schoolId: string | number, payload: MarkStudentAttendancePayload) {
    return axios.post<{ success: boolean; message: string; data: any }>(
        `${API_URL}/school/${schoolId}/attendance/students/mark`,
        payload
    )
}

// 3. All Staff Register Fetch API (GET)
// curl --location 'http://localhost:3000/api/school/30/attendance/staff?date=2024-04-10'
export function getStaffAttendance(schoolId: string | number, date: string) {
    return axios.get<StaffAttendanceFetchResponse>(`${API_URL}/school/${schoolId}/attendance/staff`, {
        params: { date }
    })
}

// 4. Mark Staff Attendance (POST)
// curl --location 'http://localhost:3000/api/school/30/attendance/staff/mark'
export function markStaffAttendance(schoolId: string | number, payload: MarkStaffAttendancePayload) {
    return axios.post<{ success: boolean; message: string; data: any }>(
        `${API_URL}/school/${schoolId}/attendance/staff/mark`,
        payload
    )
}

// 5. Class Monthly Matrix API (GET)
// curl --location 'http://localhost:3000/api/school/30/attendance/class-matrix?class_section_id=1&month=4&year=2024'
export function getClassMonthlyMatrix(
    schoolId: string | number,
    classSectionId: string | number,
    month: number,
    year: number
) {
    return axios.get<ClassMonthlyMatrixResponse>(`${API_URL}/school/${schoolId}/attendance/class-matrix`, {
        params: { class_section_id: classSectionId, month, year }
    })
}

// 6. Student Monthly Report API (GET)
// curl --location 'http://localhost:3000/api/school/30/attendance/students/1/report?month=04&year=2024'
export function getStudentMonthlyReport(
    schoolId: string | number,
    studentId: string | number,
    month: number | string,
    year: number
) {
    return axios.get<StudentMonthlyReportResponse>(
        `${API_URL}/school/${schoolId}/attendance/students/${studentId}/report`,
        {
            params: { month, year }
        }
    )
}
