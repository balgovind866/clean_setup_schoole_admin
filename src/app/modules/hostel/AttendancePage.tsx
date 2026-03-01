import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const HostelAttendance: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Hostel Attendance</h3>
        </div>
        <div className='card-body'>
          <p>Hostel attendance tracking - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const HostelAttendanceWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Hostel Attendance</PageTitle>
      <HostelAttendance />
    </>
  )
}

export { HostelAttendanceWrapper }
