import { lazy, FC, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'

const PrivateRoutes = () => {
  const StudentsPage = lazy(() => import('../modules/student/StudentsPage'))
  const AdmissionPage = lazy(() => import('../modules/students/AdmissionPage').then(m => ({ default: m.AdmissionWrapper })))
  const EnrollmentPage = lazy(() => import('../modules/students/EnrollmentPage').then(m => ({ default: m.EnrollmentWrapper })))
  const StudentAttendancePage = lazy(() => import('../modules/students/AttendancePage').then(m => ({ default: m.AttendanceWrapper })))
  const PerformancePage = lazy(() => import('../modules/students/PerformancePage').then(m => ({ default: m.PerformanceWrapper })))
  const DocumentsPage = lazy(() => import('../modules/students/DocumentsPage').then(m => ({ default: m.DocumentsWrapper })))
  const TeachersPage = lazy(() => import('../modules/teachers/TeachersPage').then(m => ({ default: m.TeachersWrapper })))
  const StaffManagementPage = lazy(() => import('../modules/staff/ManagementPage').then(m => ({ default: m.ManagementWrapper })))
  const StaffAttendancePage = lazy(() => import('../modules/staff/AttendancePage').then(m => ({ default: m.StaffAttendanceWrapper })))
  const StaffPayrollPage = lazy(() => import('../modules/staff/PayrollPage').then(m => ({ default: m.PayrollWrapper })))
  const StaffRecordsPage = lazy(() => import('../modules/staff/RecordsPage').then(m => ({ default: m.RecordsWrapper })))
  const SessionsClassesPage = lazy(() => import('../modules/sessions/SessionsClassesPage').then(m => ({ default: m.SessionsClassesWrapper })))
  const TimetablePage = lazy(() => import('../modules/timetable/TimetablePage').then(m => ({ default: m.TimetableWrapper })))
  const ExamPage = lazy(() => import('../modules/exam/ExamPage').then(m => ({ default: m.ExamWrapper })))

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        {/* Redirect to Dashboard after success login/registartion */}
        <Route path='auth/*' element={<Navigate to='/dashboard' />} />
        {/* Pages */}
        <Route path='dashboard' element={<DashboardWrapper />} />

        {/* Students */}
        <Route
          path='student/*'
          element={
            <SuspensedView>
              <StudentsPage />
            </SuspensedView>
          }
        />
        <Route
          path='students/admission'
          element={
            <SuspensedView>
              <AdmissionPage />
            </SuspensedView>
          }
        />
        <Route
          path='students/enrollment'
          element={
            <SuspensedView>
              <EnrollmentPage />
            </SuspensedView>
          }
        />
        <Route
          path='students/attendance'
          element={
            <SuspensedView>
              <StudentAttendancePage />
            </SuspensedView>
          }
        />
        <Route
          path='students/performance'
          element={
            <SuspensedView>
              <PerformancePage />
            </SuspensedView>
          }
        />
        <Route
          path='students/documents'
          element={
            <SuspensedView>
              <DocumentsPage />
            </SuspensedView>
          }
        />

        {/* Teachers */}
        <Route
          path='teachers'
          element={
            <SuspensedView>
              <TeachersPage />
            </SuspensedView>
          }
        />

        {/* Staff */}
        <Route
          path='staff/management'
          element={
            <SuspensedView>
              <StaffManagementPage />
            </SuspensedView>
          }
        />
        <Route
          path='staff/attendance'
          element={
            <SuspensedView>
              <StaffAttendancePage />
            </SuspensedView>
          }
        />
        <Route
          path='staff/payroll'
          element={
            <SuspensedView>
              <StaffPayrollPage />
            </SuspensedView>
          }
        />
        <Route
          path='staff/records'
          element={
            <SuspensedView>
              <StaffRecordsPage />
            </SuspensedView>
          }
        />

        {/* Sessions & Classes */}
        <Route
          path='sessions-classes'
          element={
            <SuspensedView>
              <SessionsClassesPage />
            </SuspensedView>
          }
        />

        {/* Timetable */}
        <Route
          path='timetable'
          element={
            <SuspensedView>
              <TimetablePage />
            </SuspensedView>
          }
        />

        {/* Exam */}
        <Route
          path='exam'
          element={
            <SuspensedView>
              <ExamPage />
            </SuspensedView>
          }
        />

        {/* Page Not Found */}
        <Route path='*' element={<Navigate to='/error/404' />} />
      </Route>
    </Routes>
  )
}

const SuspensedView: FC<WithChildren> = ({ children }) => {
  const baseColor = getCSSVariableValue('--bs-primary')
  TopBarProgress.config({
    barColors: {
      '0': baseColor,
    },
    barThickness: 1,
    shadowBlur: 5,
  })
  return <Suspense fallback={<TopBarProgress />}>{children}</Suspense>
}

export { PrivateRoutes }
