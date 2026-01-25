import { useIntl } from 'react-intl'
import { KTIcon } from '../../../../helpers'
import { SidebarMenuItemWithSub } from './SidebarMenuItemWithSub'
import { SidebarMenuItem } from './SidebarMenuItem'

const SidebarMenuMain = () => {
  const intl = useIntl()

  return (
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

      <SidebarMenuItem
        to='/teachers'
        icon='teacher'
        title='Teachers'
        fontIcon='bi-person-badge'
      />

      <SidebarMenuItem
        to='/staff/management'
        icon='profile-user'
        title='Staff Management'
        fontIcon='bi-person-gear'
      />

      <SidebarMenuItem
        to='/staff/attendance'
        icon='calendar-tick'
        title='Staff Attendance'
        fontIcon='bi-calendar-check'
      />

      <SidebarMenuItem
        to='/staff/payroll'
        icon='dollar'
        title='Staff Payroll'
        fontIcon='bi-cash-stack'
      />

      <SidebarMenuItem
        to='/staff/records'
        icon='folder'
        title='Staff Records'
        fontIcon='bi-folder2'
      />

      <SidebarMenuItem
        to='/sessions-classes'
        icon='book'
        title='Sessions & Classes'
        fontIcon='bi-book'
      />

      <SidebarMenuItem
        to='/timetable'
        icon='calendar'
        title='Timetable'
        fontIcon='bi-calendar3'
      />

      <SidebarMenuItem
        to='/exam'
        icon='notepad'
        title='Exam'
        fontIcon='bi-journal-text'
      />
    </>
  )
}

export { SidebarMenuMain }
