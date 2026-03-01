import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const StaffPerformance: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Performance</h3>
        </div>
        <div className='card-body'>
          <p>Staff evaluations and reviews - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const StaffPerformanceWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Performance</PageTitle>
      <StaffPerformance />
    </>
  )
}

export { StaffPerformanceWrapper }
