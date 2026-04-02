// Comprehensive route configuration for all school management modules
import { lazy } from 'react'

// Helper function to create lazy imports with wrapper extraction
const lazyLoad = (importFn: () => Promise<any>, wrapperName: string) =>
    lazy(() => importFn().then(m => ({ default: m[wrapperName] })))

// Academic Module Routes
export const academicRoutes = {
    sessions: lazy(() => import('../modules/academic/sessions/AcademicSessionsPage')),
    classes: lazyLoad(() => import('../modules/academic/ClassesPage'), 'ClassesWrapper'),
    // sections shares the same page as classes (tabbed UI handles both)
    sections: lazyLoad(() => import('../modules/academic/ClassesPage'), 'ClassesWrapper'),
    subjects: lazyLoad(() => import('../modules/academic/SubjectsPage'), 'SubjectsWrapper'),
    mapping: lazyLoad(() => import('../modules/academic/MappingPage'), 'MappingWrapper'),
    calendar: lazyLoad(() => import('../modules/academic/CalendarPage'), 'CalendarWrapper'),
    syllabus: lazyLoad(() => import('../modules/academic/SyllabusPage'), 'SyllabusWrapper'),
    lessons: lazyLoad(() => import('../modules/academic/LessonsPage'), 'LessonsWrapper'),
    examSchedule: lazyLoad(() => import('../modules/academic/ExamSchedulePage'), 'ExamScheduleWrapper'),
}

// Fee Module Routes
export const feeRoutes = {
    structure: lazyLoad(() => import('../modules/fees/StructurePage'), 'StructureWrapper'),
    collection: lazyLoad(() => import('../modules/fees/CollectionPage'), 'CollectionWrapper'),
    monthly: lazyLoad(() => import('../modules/fees/MonthlyCollectionPage'), 'MonthlyCollectionWrapper'),
    tracking: lazyLoad(() => import('../modules/fees/TrackingPage'), 'TrackingWrapper'),
    receipts: lazyLoad(() => import('../modules/fees/ReceiptsPage'), 'ReceiptsWrapper'),
    concessions: lazyLoad(() => import('../modules/fees/ConcessionsPage'), 'ConcessionsWrapper'),
    reports: lazyLoad(() => import('../modules/fees/ReportsPage'), 'FeeReportsWrapper'),
}

// Examination Module Routes
export const examinationRoutes = {
    exams: lazyLoad(() => import('../modules/examination/ExamsPage'), 'ExamsWrapper'),
    marks: lazyLoad(() => import('../modules/examination/MarksPage'), 'MarksWrapper'),
    reportCards: lazyLoad(() => import('../modules/examination/ReportCardsPage'), 'ReportCardsWrapper'),
    results: lazyLoad(() => import('../modules/examination/ResultsPage'), 'ResultsWrapper'),
    online: lazyLoad(() => import('../modules/examination/OnlinePage'), 'OnlineExamsWrapper'),
}

// Library Module Routes
export const libraryRoutes = {
    books: lazyLoad(() => import('../modules/library/BooksPage'), 'BooksWrapper'),
    issueReturn: lazyLoad(() => import('../modules/library/IssueReturnPage'), 'IssueReturnWrapper'),
    fines: lazyLoad(() => import('../modules/library/FinesPage'), 'FinesWrapper'),
    digital: lazyLoad(() => import('../modules/library/DigitalPage'), 'DigitalWrapper'),
}

// Transport Module Routes
export const transportRoutes = {
    routes: lazyLoad(() => import('../modules/transport/RoutesPage'), 'RoutesWrapper'),
    vehicles: lazyLoad(() => import('../modules/transport/VehiclesPage'), 'VehiclesWrapper'),
    drivers: lazyLoad(() => import('../modules/transport/DriversPage'), 'DriversWrapper'),
    allocation: lazyLoad(() => import('../modules/transport/AllocationPage'), 'AllocationWrapper'),
    fees: lazyLoad(() => import('../modules/transport/FeesPage'), 'TransportFeesWrapper'),
}

// Hostel Module Routes
export const hostelRoutes = {
    rooms: lazyLoad(() => import('../modules/hostel/RoomsPage'), 'RoomsWrapper'),
    attendance: lazyLoad(() => import('../modules/hostel/AttendancePage'), 'HostelAttendanceWrapper'),
    mess: lazyLoad(() => import('../modules/hostel/MessPage'), 'MessWrapper'),
    fees: lazyLoad(() => import('../modules/hostel/FeesPage'), 'HostelFeesWrapper'),
}

// Communication Module Routes
export const communicationRoutes = {
    announcements: lazyLoad(() => import('../modules/communication/AnnouncementsPage'), 'AnnouncementsWrapper'),
    notifications: lazyLoad(() => import('../modules/communication/NotificationsPage'), 'NotificationsWrapper'),
    messaging: lazyLoad(() => import('../modules/communication/MessagingPage'), 'MessagingWrapper'),
    noticeBoard: lazyLoad(() => import('../modules/communication/NoticeBoardPage'), 'NoticeBoardWrapper'),
}

// Inventory Module Routes
export const inventoryRoutes = {
    assets: lazyLoad(() => import('../modules/inventory/AssetsPage'), 'AssetsWrapper'),
    supplies: lazyLoad(() => import('../modules/inventory/SuppliesPage'), 'SuppliesWrapper'),
    maintenance: lazyLoad(() => import('../modules/inventory/MaintenancePage'), 'MaintenanceWrapper'),
    vendors: lazyLoad(() => import('../modules/inventory/VendorsPage'), 'VendorsWrapper'),
}

// Payroll Module Routes
export const payrollRoutes = {
    structure: lazyLoad(() => import('../modules/payroll/StructurePage'), 'SalaryStructureWrapper'),
    processing: lazyLoad(() => import('../modules/payroll/ProcessingPage'), 'ProcessingWrapper'),
    tax: lazyLoad(() => import('../modules/payroll/TaxPage'), 'TaxWrapper'),
    payslips: lazyLoad(() => import('../modules/payroll/PayslipsPage'), 'PayslipsWrapper'),
    integration: lazyLoad(() => import('../modules/payroll/IntegrationPage'), 'IntegrationWrapper'),
}

// Reports Module Routes
export const reportRoutes = {
    students: lazyLoad(() => import('../modules/reports/StudentReportsPage'), 'StudentReportsWrapper'),
    attendance: lazyLoad(() => import('../modules/reports/AttendanceReportsPage'), 'AttendanceReportsWrapper'),
    financial: lazyLoad(() => import('../modules/reports/FinancialReportsPage'), 'FinancialReportsWrapper'),
    staff: lazyLoad(() => import('../modules/reports/StaffReportsPage'), 'StaffReportsWrapper'),
    custom: lazyLoad(() => import('../modules/reports/CustomReportsPage'), 'CustomReportsWrapper'),
    export: lazyLoad(() => import('../modules/reports/ExportPage'), 'ExportWrapper'),
}

// Settings Module Routes
export const settingsRoutes = {
    profile: lazyLoad(() => import('../modules/settings/ProfilePage'), 'SchoolProfileWrapper'),
    academicYear: lazyLoad(() => import('../modules/settings/AcademicYearPage'), 'AcademicYearWrapper'),
    roles: lazyLoad(() => import('../modules/settings/RolesPage'), 'RolesWrapper'),
    preferences: lazyLoad(() => import('../modules/settings/PreferencesPage'), 'PreferencesWrapper'),
    backup: lazyLoad(() => import('../modules/settings/BackupPage'), 'BackupWrapper'),
}

// Staff Module Additional Routes
export const staffAdditionalRoutes = {
    teachers: lazyLoad(() => import('../modules/staff/TeachersPage'), 'TeachersWrapper'),
    nonTeaching: lazyLoad(() => import('../modules/staff/NonTeachingPage'), 'NonTeachingWrapper'),
    recruitment: lazyLoad(() => import('../modules/staff/RecruitmentPage'), 'RecruitmentWrapper'),
    attendance: lazyLoad(() => import('../modules/staff/AttendancePage'), 'StaffAttendanceWrapper'),
    leave: lazyLoad(() => import('../modules/staff/LeavePage'), 'LeaveWrapper'),
    performance: lazyLoad(() => import('../modules/staff/PerformancePage'), 'StaffPerformanceWrapper'),
    documents: lazyLoad(() => import('../modules/staff/DocumentsPage'), 'StaffDocumentsWrapper'),
    rolesPermissions: lazyLoad(() => import('../modules/staff/RolesPermissionsPage'), 'RolesPermissionsWrapper'),
}

// Timetable Module Additional Routes
export const timetableAdditionalRoutes = {
    classes: lazyLoad(() => import('../modules/timetable/ClassesPage'), 'ClassTimetableWrapper'),
    teachers: lazyLoad(() => import('../modules/timetable/TeachersPage'), 'TeacherScheduleWrapper'),
    resources: lazyLoad(() => import('../modules/timetable/ResourcesPage'), 'ResourcesWrapper'),
    substitution: lazyLoad(() => import('../modules/timetable/SubstitutionPage'), 'SubstitutionWrapper'),
    periods: lazyLoad(() => import('../modules/timetable/PeriodsPage'), 'PeriodsWrapper'),
}
