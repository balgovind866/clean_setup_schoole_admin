#!/bin/bash

# Script to generate all school management system pages

# Helper function to create a page component
create_page() {
    local file_path=$1
    local wrapper_name=$2
    local page_title=$3
    local description=$4
    
    cat > "$file_path" << 'EOF'
import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const PAGE_NAME: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>PAGE_TITLE</h3>
        </div>
        <div className='card-body'>
          <p>PAGE_DESCRIPTION</p>
        </div>
      </div>
    </Content>
  </>
)

const WRAPPER_NAME: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>PAGE_TITLE</PageTitle>
      <PAGE_NAME />
    </>
  )
}

export { WRAPPER_NAME }
EOF

    # Replace placeholders
    sed -i '' "s/PAGE_NAME/${wrapper_name%Wrapper}/g" "$file_path"
    sed -i '' "s/WRAPPER_NAME/$wrapper_name/g" "$file_path"
    sed -i '' "s/PAGE_TITLE/$page_title/g" "$file_path"
    sed -i '' "s/PAGE_DESCRIPTION/$description/g" "$file_path"
}

# Academic Module
create_page "src/app/modules/academic/ClassesPage.tsx" "ClassesWrapper" "Classes & Sections" "Class and section management - Coming soon"
create_page "src/app/modules/academic/SubjectsPage.tsx" "SubjectsWrapper" "Subjects" "Subject creation and allocation - Coming soon"
create_page "src/app/modules/academic/MappingPage.tsx" "MappingWrapper" "Teacher Mapping" "Teacher-subject-class assignments - Coming soon"
create_page "src/app/modules/academic/CalendarPage.tsx" "CalendarWrapper" "Academic Calendar" "Academic year calendar - Coming soon"
create_page "src/app/modules/academic/SyllabusPage.tsx" "SyllabusWrapper" "Syllabus" "Curriculum management - Coming soon"
create_page "src/app/modules/academic/LessonsPage.tsx" "LessonsWrapper" "Lesson Plans" "Lesson planning - Coming soon"
create_page "src/app/modules/academic/ExamSchedulePage.tsx" "ExamScheduleWrapper" "Exam Schedule" "Exam planning and scheduling - Coming soon"

# Fee Module
create_page "src/app/modules/fees/StructurePage.tsx" "StructureWrapper" "Fee Structure" "Fee categories and amounts setup - Coming soon"
create_page "src/app/modules/fees/CollectionPage.tsx" "CollectionWrapper" "Fee Collection" "Fee payment processing - Coming soon"
create_page "src/app/modules/fees/TrackingPage.tsx" "TrackingWrapper" "Payment Tracking" "Payment status monitoring - Coming soon"
create_page "src/app/modules/fees/ReceiptsPage.tsx" "ReceiptsWrapper" "Receipts" "Receipt generation and management - Coming soon"
create_page "src/app/modules/fees/ConcessionsPage.tsx" "ConcessionsWrapper" "Concessions" "Discounts and scholarships - Coming soon"
create_page "src/app/modules/fees/ReportsPage.tsx" "FeeReportsWrapper" "Fee Reports" "Financial reports and analytics - Coming soon"

# Examination Module  
create_page "src/app/modules/examination/ExamsPage.tsx" "ExamsWrapper" "Exams" "Exam creation and scheduling - Coming soon"
create_page "src/app/modules/examination/MarksPage.tsx" "MarksWrapper" "Marks Entry" "Grade and marks input - Coming soon"
create_page "src/app/modules/examination/ReportCardsPage.tsx" "ReportCardsWrapper" "Report Cards" "Report card generation - Coming soon"
create_page "src/app/modules/examination/ResultsPage.tsx" "ResultsWrapper" "Results" "Result analysis and statistics - Coming soon"
create_page "src/app/modules/examination/OnlinePage.tsx" "OnlineExamsWrapper" "Online Exams" "Digital examination system - Coming soon"

# Library Module
create_page "src/app/modules/library/BooksPage.tsx" "BooksWrapper" "Books" "Book inventory management - Coming soon"
create_page "src/app/modules/library/IssueReturnPage.tsx" "IssueReturnWrapper" "Issue/Return" "Book lending and returns - Coming soon"
create_page "src/app/modules/library/FinesPage.tsx" "FinesWrapper" "Fines" "Late return fine management - Coming soon"
create_page "src/app/modules/library/DigitalPage.tsx" "DigitalWrapper" "Digital Resources" "E-books and digital library - Coming soon"

# Transport Module
create_page "src/app/modules/transport/RoutesPage.tsx" "RoutesWrapper" "Routes" "Route planning and management - Coming soon"
create_page "src/app/modules/transport/VehiclesPage.tsx" "VehiclesWrapper" "Vehicles" "Vehicle tracking and management - Coming soon"
create_page "src/app/modules/transport/DriversPage.tsx" "DriversWrapper" "Drivers" "Driver and conductor details - Coming soon"
create_page "src/app/modules/transport/AllocationPage.tsx" "AllocationWrapper" "Allocation" "Student transport assignment - Coming soon"
create_page "src/app/modules/transport/FeesPage.tsx" "TransportFeesWrapper" "Transport Fees" "Transport fee management - Coming soon"

# Hostel Module
create_page "src/app/modules/hostel/RoomsPage.tsx" "RoomsWrapper" "Rooms" "Room allocation and management - Coming soon"
create_page "src/app/modules/hostel/AttendancePage.tsx" "HostelAttendanceWrapper" "Hostel Attendance" "Hostel attendance tracking - Coming soon"
create_page "src/app/modules/hostel/MessPage.tsx" "MessWrapper" "Mess" "Mess management system - Coming soon"
create_page "src/app/modules/hostel/FeesPage.tsx" "HostelFeesWrapper" "Hostel Fees" "Hostel fee management - Coming soon"

# Communication Module
create_page "src/app/modules/communication/AnnouncementsPage.tsx" "AnnouncementsWrapper" "Announcements" "School announcements and circulars - Coming soon"
create_page "src/app/modules/communication/NotificationsPage.tsx" "NotificationsWrapper" "Notifications" "SMS and email notifications - Coming soon"
create_page "src/app/modules/communication/MessagingPage.tsx" "MessagingWrapper" "Messaging" "Parent-teacher messaging - Coming soon"
create_page "src/app/modules/communication/NoticeBoardPage.tsx" "NoticeBoardWrapper" "Notice Board" "Digital notice board - Coming soon"

# Inventory Module
create_page "src/app/modules/inventory/AssetsPage.tsx" "AssetsWrapper" "Assets" "School property tracking - Coming soon"
create_page "src/app/modules/inventory/SuppliesPage.tsx" "SuppliesWrapper" "Supplies" "Stationery and supplies management - Coming soon"
create_page "src/app/modules/inventory/MaintenancePage.tsx" "MaintenanceWrapper" "Maintenance" "Equipment maintenance tracking - Coming soon"
create_page "src/app/modules/inventory/VendorsPage.tsx" "VendorsWrapper" "Vendors" "Vendor management system - Coming soon"

# Payroll Module
create_page "src/app/modules/payroll/StructurePage.tsx" "SalaryStructureWrapper" "Salary Structure" "Pay scales and components - Coming soon"
create_page "src/app/modules/payroll/ProcessingPage.tsx" "ProcessingWrapper" "Processing" "Salary calculation and processing - Coming soon"
create_page "src/app/modules/payroll/TaxPage.tsx" "TaxWrapper" "Tax" "Tax calculations and deductions - Coming soon"
create_page "src/app/modules/payroll/PayslipsPage.tsx" "PayslipsWrapper" "Payslips" "Payslip generation and distribution - Coming soon"
create_page "src/app/modules/payroll/IntegrationPage.tsx" "IntegrationWrapper" "Integration" "Leave and attendance integration - Coming soon"

# Reports Module
create_page "src/app/modules/reports/StudentReportsPage.tsx" "StudentReportsWrapper" "Student Reports" "Student progress and performance reports - Coming soon"
create_page "src/app/modules/reports/AttendanceReportsPage.tsx" "AttendanceReportsWrapper" "Attendance Reports" "Attendance analytics and reports - Coming soon"
create_page "src/app/modules/reports/FinancialReportsPage.tsx" "FinancialReportsWrapper" "Financial Reports" "Fee and expense reports - Coming soon"
create_page "src/app/modules/reports/StaffReportsPage.tsx" "StaffReportsWrapper" "Staff Reports" "Staff performance reports - Coming soon"
create_page "src/app/modules/reports/CustomReportsPage.tsx" "CustomReportsWrapper" "Custom Reports" "Custom report builder - Coming soon"
create_page "src/app/modules/reports/ExportPage.tsx" "ExportWrapper" "Export" "Data export tools - Coming soon"

# Settings Module
create_page "src/app/modules/settings/ProfilePage.tsx" "SchoolProfileWrapper" "School Profile" "School information and details - Coming soon"
create_page "src/app/modules/settings/AcademicYearPage.tsx" "AcademicYearWrapper" "Academic Year" "Academic year setup and management - Coming soon"
create_page "src/app/modules/settings/RolesPage.tsx" "RolesWrapper" "Roles & Permissions" "User access control and permissions - Coming soon"
create_page "src/app/modules/settings/PreferencesPage.tsx" "PreferencesWrapper" "Preferences" "System settings and preferences - Coming soon"
create_page "src/app/modules/settings/BackupPage.tsx" "BackupWrapper" "Backup & Security" "Data backup and security settings - Coming soon"

# Staff Module - Additional pages
create_page "src/app/modules/staff/TeachersPage.tsx" "TeachersWrapper" "Teachers" "Teacher profiles and management - Coming soon"
create_page "src/app/modules/staff/NonTeachingPage.tsx" "NonTeachingWrapper" "Non-Teaching Staff" "Administrative and support staff - Coming soon"
create_page "src/app/modules/staff/RecruitmentPage.tsx" "RecruitmentWrapper" "Recruitment" "Job postings and onboarding - Coming soon"
create_page "src/app/modules/staff/LeavePage.tsx" "LeaveWrapper" "Leave Management" "Leave requests and approvals - Coming soon"
create_page "src/app/modules/staff/PerformancePage.tsx" "StaffPerformanceWrapper" "Performance" "Staff evaluations and reviews - Coming soon"
create_page "src/app/modules/staff/DocumentsPage.tsx" "StaffDocumentsWrapper" "Documents" "Staff certificates and contracts - Coming soon"
create_page "src/app/modules/staff/RolesPermissionsPage.tsx" "RolesPermissionsWrapper" "Roles & Permissions" "Staff access control - Coming soon"

# Timetable Module - Additional pages
create_page "src/app/modules/timetable/ClassesPage.tsx" "ClassTimetableWrapper" "Class Timetable" "Class-wise timetable creation - Coming soon"
create_page "src/app/modules/timetable/TeachersPage.tsx" "TeacherScheduleWrapper" "Teacher Schedule" "Teacher timetable management - Coming soon"
create_page "src/app/modules/timetable/ResourcesPage.tsx" "ResourcesWrapper" "Resources" "Room and resource allocation - Coming soon"
create_page "src/app/modules/timetable/SubstitutionPage.tsx" "SubstitutionWrapper" "Substitution" "Teacher substitution management - Coming soon"
create_page "src/app/modules/timetable/PeriodsPage.tsx" "PeriodsWrapper" "Periods" "Period and break management - Coming soon"

echo "All pages created successfully!"
