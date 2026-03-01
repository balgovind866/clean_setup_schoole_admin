import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Leave: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Leave Management</h3>
        </div>
        <div className='card-body'>
          <p>Leave requests and approvals - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const LeaveWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Leave Management</PageTitle>
      <Leave />
    </>
  )
}

export { LeaveWrapper }
