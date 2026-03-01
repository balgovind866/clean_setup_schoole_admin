import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const StaffReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Staff Reports</h3>
        </div>
        <div className='card-body'>
          <p>Staff performance reports - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const StaffReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Staff Reports</PageTitle>
      <StaffReports />
    </>
  )
}

export { StaffReportsWrapper }
