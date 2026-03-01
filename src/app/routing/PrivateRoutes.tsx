import { lazy, FC, Suspense } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { MasterLayout } from '../../_metronic/layout/MasterLayout'
import TopBarProgress from 'react-topbar-progress-indicator'
import { DashboardWrapper } from '../pages/dashboard/DashboardWrapper'
import { getCSSVariableValue } from '../../_metronic/assets/ts/_utils'
import { WithChildren } from '../../_metronic/helpers'
import * as RouteConfig from './RouteConfig'

import { useAuth } from '../modules/auth'

const PrivateRoutes = () => {
  const { currentUser } = useAuth()
  // Existing routes
  const StudentsPage = lazy(() => import('../modules/student/StudentsPage'))
  const AdministrationPage = lazy(() => import('../modules/administration/AdministrationPage'))
  const AdmissionPage = lazy(() => import('../modules/students/AdmissionPage').then(m => ({ default: m.AdmissionWrapper })))
  const EnrollmentPage = lazy(() => import('../modules/students/EnrollmentPage').then(m => ({ default: m.EnrollmentWrapper })))
  const StudentAttendancePage = lazy(() => import('../modules/students/AttendancePage').then(m => ({ default: m.AttendanceWrapper })))
  const PerformancePage = lazy(() => import('../modules/students/PerformancePage').then(m => ({ default: m.PerformanceWrapper })))
  const DocumentsPage = lazy(() => import('../modules/students/DocumentsPage').then(m => ({ default: m.DocumentsWrapper })))

  return (
    <Routes>
      <Route element={<MasterLayout />}>
        <Route path='auth/*' element={<Navigate to={currentUser?.role === 'superadmin' ? '/administration' : '/dashboard'} />} />

        {/* Redirect based on role */}
        <Route
          path='dashboard'
          element={
            currentUser?.role === 'superadmin' ? (
              <Navigate to='/administration' />
            ) : (
              <DashboardWrapper />
            )
          }
        />

        <Route
          path='administration/*'
          element={
            currentUser?.role === 'superadmin' ? (
              <SuspensedView>
                <AdministrationPage />
              </SuspensedView>
            ) : (
              <Navigate to='/dashboard' />
            )
          }
        />

        {/* Students */}
        <Route path='student/*' element={<SuspensedView><StudentsPage /></SuspensedView>} />
        <Route path='students/admission' element={<SuspensedView><AdmissionPage /></SuspensedView>} />
        <Route path='students/enrollment' element={<SuspensedView><EnrollmentPage /></SuspensedView>} />
        <Route path='students/attendance' element={<SuspensedView><StudentAttendancePage /></SuspensedView>} />
        <Route path='students/performance' element={<SuspensedView><PerformancePage /></SuspensedView>} />
        <Route path='students/documents' element={<SuspensedView><DocumentsPage /></SuspensedView>} />

        {/* Staff */}
        <Route path='staff/teachers' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.teachers /></SuspensedView>} />
        <Route path='staff/non-teaching' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.nonTeaching /></SuspensedView>} />
        <Route path='staff/recruitment' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.recruitment /></SuspensedView>} />
        <Route path='staff/attendance' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.attendance /></SuspensedView>} />
        <Route path='staff/leave' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.leave /></SuspensedView>} />
        <Route path='staff/performance' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.performance /></SuspensedView>} />
        <Route path='staff/documents' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.documents /></SuspensedView>} />
        <Route path='staff/roles-permissions' element={<SuspensedView><RouteConfig.staffAdditionalRoutes.rolesPermissions /></SuspensedView>} />

        {/* Academic */}
        <Route path='academic/classes' element={<SuspensedView><RouteConfig.academicRoutes.classes /></SuspensedView>} />
        <Route path='academic/subjects' element={<SuspensedView><RouteConfig.academicRoutes.subjects /></SuspensedView>} />
        <Route path='academic/mapping' element={<SuspensedView><RouteConfig.academicRoutes.mapping /></SuspensedView>} />
        <Route path='academic/calendar' element={<SuspensedView><RouteConfig.academicRoutes.calendar /></SuspensedView>} />
        <Route path='academic/syllabus' element={<SuspensedView><RouteConfig.academicRoutes.syllabus /></SuspensedView>} />
        <Route path='academic/lessons' element={<SuspensedView><RouteConfig.academicRoutes.lessons /></SuspensedView>} />
        <Route path='academic/exam-schedule' element={<SuspensedView><RouteConfig.academicRoutes.examSchedule /></SuspensedView>} />

        {/* Fees */}
        <Route path='fees/structure' element={<SuspensedView><RouteConfig.feeRoutes.structure /></SuspensedView>} />
        <Route path='fees/collection' element={<SuspensedView><RouteConfig.feeRoutes.collection /></SuspensedView>} />
        <Route path='fees/tracking' element={<SuspensedView><RouteConfig.feeRoutes.tracking /></SuspensedView>} />
        <Route path='fees/receipts' element={<SuspensedView><RouteConfig.feeRoutes.receipts /></SuspensedView>} />
        <Route path='fees/concessions' element={<SuspensedView><RouteConfig.feeRoutes.concessions /></SuspensedView>} />
        <Route path='fees/reports' element={<SuspensedView><RouteConfig.feeRoutes.reports /></SuspensedView>} />

        {/* Timetable */}
        <Route path='timetable/classes' element={<SuspensedView><RouteConfig.timetableAdditionalRoutes.classes /></SuspensedView>} />
        <Route path='timetable/teachers' element={<SuspensedView><RouteConfig.timetableAdditionalRoutes.teachers /></SuspensedView>} />
        <Route path='timetable/resources' element={<SuspensedView><RouteConfig.timetableAdditionalRoutes.resources /></SuspensedView>} />
        <Route path='timetable/substitution' element={<SuspensedView><RouteConfig.timetableAdditionalRoutes.substitution /></SuspensedView>} />
        <Route path='timetable/periods' element={<SuspensedView><RouteConfig.timetableAdditionalRoutes.periods /></SuspensedView>} />

        {/* Examination */}
        <Route path='examination/exams' element={<SuspensedView><RouteConfig.examinationRoutes.exams /></SuspensedView>} />
        <Route path='examination/marks' element={<SuspensedView><RouteConfig.examinationRoutes.marks /></SuspensedView>} />
        <Route path='examination/report-cards' element={<SuspensedView><RouteConfig.examinationRoutes.reportCards /></SuspensedView>} />
        <Route path='examination/results' element={<SuspensedView><RouteConfig.examinationRoutes.results /></SuspensedView>} />
        <Route path='examination/online' element={<SuspensedView><RouteConfig.examinationRoutes.online /></SuspensedView>} />

        {/* Library */}
        <Route path='library/books' element={<SuspensedView><RouteConfig.libraryRoutes.books /></SuspensedView>} />
        <Route path='library/issue-return' element={<SuspensedView><RouteConfig.libraryRoutes.issueReturn /></SuspensedView>} />
        <Route path='library/fines' element={<SuspensedView><RouteConfig.libraryRoutes.fines /></SuspensedView>} />
        <Route path='library/digital' element={<SuspensedView><RouteConfig.libraryRoutes.digital /></SuspensedView>} />

        {/* Transport */}
        <Route path='transport/routes' element={<SuspensedView><RouteConfig.transportRoutes.routes /></SuspensedView>} />
        <Route path='transport/vehicles' element={<SuspensedView><RouteConfig.transportRoutes.vehicles /></SuspensedView>} />
        <Route path='transport/drivers' element={<SuspensedView><RouteConfig.transportRoutes.drivers /></SuspensedView>} />
        <Route path='transport/allocation' element={<SuspensedView><RouteConfig.transportRoutes.allocation /></SuspensedView>} />
        <Route path='transport/fees' element={<SuspensedView><RouteConfig.transportRoutes.fees /></SuspensedView>} />

        {/* Hostel */}
        <Route path='hostel/rooms' element={<SuspensedView><RouteConfig.hostelRoutes.rooms /></SuspensedView>} />
        <Route path='hostel/attendance' element={<SuspensedView><RouteConfig.hostelRoutes.attendance /></SuspensedView>} />
        <Route path='hostel/mess' element={<SuspensedView><RouteConfig.hostelRoutes.mess /></SuspensedView>} />
        <Route path='hostel/fees' element={<SuspensedView><RouteConfig.hostelRoutes.fees /></SuspensedView>} />

        {/* Communication */}
        <Route path='communication/announcements' element={<SuspensedView><RouteConfig.communicationRoutes.announcements /></SuspensedView>} />
        <Route path='communication/notifications' element={<SuspensedView><RouteConfig.communicationRoutes.notifications /></SuspensedView>} />
        <Route path='communication/messaging' element={<SuspensedView><RouteConfig.communicationRoutes.messaging /></SuspensedView>} />
        <Route path='communication/notice-board' element={<SuspensedView><RouteConfig.communicationRoutes.noticeBoard /></SuspensedView>} />

        {/* Inventory */}
        <Route path='inventory/assets' element={<SuspensedView><RouteConfig.inventoryRoutes.assets /></SuspensedView>} />
        <Route path='inventory/supplies' element={<SuspensedView><RouteConfig.inventoryRoutes.supplies /></SuspensedView>} />
        <Route path='inventory/maintenance' element={<SuspensedView><RouteConfig.inventoryRoutes.maintenance /></SuspensedView>} />
        <Route path='inventory/vendors' element={<SuspensedView><RouteConfig.inventoryRoutes.vendors /></SuspensedView>} />

        {/* Payroll */}
        <Route path='payroll/structure' element={<SuspensedView><RouteConfig.payrollRoutes.structure /></SuspensedView>} />
        <Route path='payroll/processing' element={<SuspensedView><RouteConfig.payrollRoutes.processing /></SuspensedView>} />
        <Route path='payroll/tax' element={<SuspensedView><RouteConfig.payrollRoutes.tax /></SuspensedView>} />
        <Route path='payroll/payslips' element={<SuspensedView><RouteConfig.payrollRoutes.payslips /></SuspensedView>} />
        <Route path='payroll/integration' element={<SuspensedView><RouteConfig.payrollRoutes.integration /></SuspensedView>} />

        {/* Reports */}
        <Route path='reports/students' element={<SuspensedView><RouteConfig.reportRoutes.students /></SuspensedView>} />
        <Route path='reports/attendance' element={<SuspensedView><RouteConfig.reportRoutes.attendance /></SuspensedView>} />
        <Route path='reports/financial' element={<SuspensedView><RouteConfig.reportRoutes.financial /></SuspensedView>} />
        <Route path='reports/staff' element={<SuspensedView><RouteConfig.reportRoutes.staff /></SuspensedView>} />
        <Route path='reports/custom' element={<SuspensedView><RouteConfig.reportRoutes.custom /></SuspensedView>} />
        <Route path='reports/export' element={<SuspensedView><RouteConfig.reportRoutes.export /></SuspensedView>} />

        {/* Settings */}
        <Route path='settings/profile' element={<SuspensedView><RouteConfig.settingsRoutes.profile /></SuspensedView>} />
        <Route path='settings/academic-year' element={<SuspensedView><RouteConfig.settingsRoutes.academicYear /></SuspensedView>} />
        <Route path='settings/roles' element={<SuspensedView><RouteConfig.settingsRoutes.roles /></SuspensedView>} />
        <Route path='settings/preferences' element={<SuspensedView><RouteConfig.settingsRoutes.preferences /></SuspensedView>} />
        <Route path='settings/backup' element={<SuspensedView><RouteConfig.settingsRoutes.backup /></SuspensedView>} />

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
