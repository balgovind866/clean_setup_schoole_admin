import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const StudentReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Student Reports</h3>
        </div>
        <div className='card-body'>
          <p>Student progress and performance reports - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const StudentReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Student Reports</PageTitle>
      <StudentReports />
    </>
  )
}

export { StudentReportsWrapper }
