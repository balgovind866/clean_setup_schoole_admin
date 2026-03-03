import { useIntl } from 'react-intl'
import { KTIcon } from '../../../../helpers'
import { SidebarMenuItemWithSub } from './SidebarMenuItemWithSub'
import { SidebarMenuItem } from './SidebarMenuItem'
import { useAuth } from '../../../../../app/modules/auth'

const SidebarMenuMain = () => {
  const intl = useIntl()
  const { currentUser } = useAuth()
  const isSuperAdmin = currentUser?.role === 'super_admin'

  return (
    <>
      {isSuperAdmin ? (
        <>
          <SidebarMenuItem
            to='/administration'
            icon='element-11'
            title='Administration'
            fontIcon='bi-app-indicator'
          />
        </>
      ) : (
        <>
          <SidebarMenuItem
            to='/dashboard'
            icon='element-11'
            title={intl.formatMessage({ id: 'MENU.DASHBOARD' })}
            fontIcon='bi-app-indicator'
          />

          <SidebarMenuItemWithSub
            to='/students'
            title='Students'
            icon='user'
            fontIcon='bi-people'
          >
            <SidebarMenuItem to='/students/admission' title='Admission' hasBullet={true} />
            <SidebarMenuItem to='/students/enrollment' title='Enrollment' hasBullet={true} />
            <SidebarMenuItem to='/students/attendance' title='Attendance' hasBullet={true} />
            <SidebarMenuItem to='/students/performance' title='Performance' hasBullet={true} />
            <SidebarMenuItem to='/students/documents' title='Documents' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/staff'
            title='Staff'
            icon='profile-user'
            fontIcon='bi-people-fill'
          >
            <SidebarMenuItem to='/staff/teachers' title='Teachers' hasBullet={true} />
            <SidebarMenuItem to='/staff/non-teaching' title='Non-Teaching Staff' hasBullet={true} />
            <SidebarMenuItem to='/staff/recruitment' title='Recruitment' hasBullet={true} />
            <SidebarMenuItem to='/staff/attendance' title='Attendance' hasBullet={true} />
            <SidebarMenuItem to='/staff/leave' title='Leave Management' hasBullet={true} />
            <SidebarMenuItem to='/staff/performance' title='Performance' hasBullet={true} />
            <SidebarMenuItem to='/staff/documents' title='Documents' hasBullet={true} />
            <SidebarMenuItem to='/staff/roles-permissions' title='Roles & Permissions' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/academic'
            title='Academic'
            icon='book-open'
            fontIcon='bi-journal-bookmark'
          >
            <SidebarMenuItem to='/academic/classes' title='Classes & Sections' hasBullet={true} />
            <SidebarMenuItem to='/academic/subjects' title='Subjects' hasBullet={true} />
            <SidebarMenuItem to='/academic/mapping' title='Teacher Mapping' hasBullet={true} />
            <SidebarMenuItem to='/academic/calendar' title='Calendar' hasBullet={true} />
            <SidebarMenuItem to='/academic/syllabus' title='Syllabus' hasBullet={true} />
            <SidebarMenuItem to='/academic/lessons' title='Lesson Plans' hasBullet={true} />
            <SidebarMenuItem to='/academic/exam-schedule' title='Exam Schedule' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/fees'
            title='Fees'
            icon='dollar'
            fontIcon='bi-cash-stack'
          >
            <SidebarMenuItem to='/fees/structure' title='Fee Structure' hasBullet={true} />
            <SidebarMenuItem to='/fees/collection' title='Collection' hasBullet={true} />
            <SidebarMenuItem to='/fees/tracking' title='Tracking' hasBullet={true} />
            <SidebarMenuItem to='/fees/receipts' title='Receipts' hasBullet={true} />
            <SidebarMenuItem to='/fees/concessions' title='Concessions' hasBullet={true} />
            <SidebarMenuItem to='/fees/reports' title='Reports' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/timetable'
            title='Timetable'
            icon='calendar'
            fontIcon='bi-calendar3'
          >
            <SidebarMenuItem to='/timetable/classes' title='Class Timetable' hasBullet={true} />
            <SidebarMenuItem to='/timetable/teachers' title='Teacher Schedule' hasBullet={true} />
            <SidebarMenuItem to='/timetable/resources' title='Resources' hasBullet={true} />
            <SidebarMenuItem to='/timetable/substitution' title='Substitution' hasBullet={true} />
            <SidebarMenuItem to='/timetable/periods' title='Periods' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/examination'
            title='Examination'
            icon='notepad'
            fontIcon='bi-journal-text'
          >
            <SidebarMenuItem to='/examination/exams' title='Exams' hasBullet={true} />
            <SidebarMenuItem to='/examination/marks' title='Marks Entry' hasBullet={true} />
            <SidebarMenuItem to='/examination/report-cards' title='Report Cards' hasBullet={true} />
            <SidebarMenuItem to='/examination/results' title='Results' hasBullet={true} />
            <SidebarMenuItem to='/examination/online' title='Online Exams' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/library'
            title='Library'
            icon='book'
            fontIcon='bi-book'
          >
            <SidebarMenuItem to='/library/books' title='Books' hasBullet={true} />
            <SidebarMenuItem to='/library/issue-return' title='Issue/Return' hasBullet={true} />
            <SidebarMenuItem to='/library/fines' title='Fines' hasBullet={true} />
            <SidebarMenuItem to='/library/digital' title='Digital Resources' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/transport'
            title='Transport'
            icon='delivery-3'
            fontIcon='bi-truck'
          >
            <SidebarMenuItem to='/transport/routes' title='Routes' hasBullet={true} />
            <SidebarMenuItem to='/transport/vehicles' title='Vehicles' hasBullet={true} />
            <SidebarMenuItem to='/transport/drivers' title='Drivers' hasBullet={true} />
            <SidebarMenuItem to='/transport/allocation' title='Allocation' hasBullet={true} />
            <SidebarMenuItem to='/transport/fees' title='Fees' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/hostel'
            title='Hostel'
            icon='home-2'
            fontIcon='bi-building'
          >
            <SidebarMenuItem to='/hostel/rooms' title='Rooms' hasBullet={true} />
            <SidebarMenuItem to='/hostel/attendance' title='Attendance' hasBullet={true} />
            <SidebarMenuItem to='/hostel/mess' title='Mess' hasBullet={true} />
            <SidebarMenuItem to='/hostel/fees' title='Fees' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/communication'
            title='Communication'
            icon='message-text'
            fontIcon='bi-chat-dots'
          >
            <SidebarMenuItem to='/communication/announcements' title='Announcements' hasBullet={true} />
            <SidebarMenuItem to='/communication/notifications' title='Notifications' hasBullet={true} />
            <SidebarMenuItem to='/communication/messaging' title='Messaging' hasBullet={true} />
            <SidebarMenuItem to='/communication/notice-board' title='Notice Board' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/inventory'
            title='Inventory'
            icon='package'
            fontIcon='bi-box-seam'
          >
            <SidebarMenuItem to='/inventory/assets' title='Assets' hasBullet={true} />
            <SidebarMenuItem to='/inventory/supplies' title='Supplies' hasBullet={true} />
            <SidebarMenuItem to='/inventory/maintenance' title='Maintenance' hasBullet={true} />
            <SidebarMenuItem to='/inventory/vendors' title='Vendors' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/payroll'
            title='HR & Payroll'
            icon='wallet'
            fontIcon='bi-wallet2'
          >
            <SidebarMenuItem to='/payroll/structure' title='Salary Structure' hasBullet={true} />
            <SidebarMenuItem to='/payroll/processing' title='Processing' hasBullet={true} />
            <SidebarMenuItem to='/payroll/tax' title='Tax' hasBullet={true} />
            <SidebarMenuItem to='/payroll/payslips' title='Payslips' hasBullet={true} />
            <SidebarMenuItem to='/payroll/integration' title='Integration' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/reports'
            title='Reports'
            icon='chart-simple'
            fontIcon='bi-bar-chart'
          >
            <SidebarMenuItem to='/reports/students' title='Student Reports' hasBullet={true} />
            <SidebarMenuItem to='/reports/attendance' title='Attendance' hasBullet={true} />
            <SidebarMenuItem to='/reports/financial' title='Financial' hasBullet={true} />
            <SidebarMenuItem to='/reports/staff' title='Staff' hasBullet={true} />
            <SidebarMenuItem to='/reports/custom' title='Custom' hasBullet={true} />
            <SidebarMenuItem to='/reports/export' title='Export' hasBullet={true} />
          </SidebarMenuItemWithSub>

          <SidebarMenuItemWithSub
            to='/settings'
            title='Settings'
            icon='setting-2'
            fontIcon='bi-gear'
          >
            <SidebarMenuItem to='/settings/profile' title='School Profile' hasBullet={true} />
            <SidebarMenuItem to='/settings/academic-year' title='Academic Year' hasBullet={true} />
            <SidebarMenuItem to='/settings/roles' title='Roles & Permissions' hasBullet={true} />
            <SidebarMenuItem to='/settings/preferences' title='Preferences' hasBullet={true} />
            <SidebarMenuItem to='/settings/backup' title='Backup & Security' hasBullet={true} />
          </SidebarMenuItemWithSub>
        </>
      )}
    </>
  )
}

export { SidebarMenuMain }
