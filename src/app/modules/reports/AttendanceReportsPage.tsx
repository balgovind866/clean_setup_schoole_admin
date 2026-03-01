import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const AttendanceReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Attendance Reports</h3>
        </div>
        <div className='card-body'>
          <p>Attendance analytics and reports - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const AttendanceReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Attendance Reports</PageTitle>
      <AttendanceReports />
    </>
  )
}

export { AttendanceReportsWrapper }
