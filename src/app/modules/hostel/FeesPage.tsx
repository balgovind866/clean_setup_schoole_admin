import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const HostelFees: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Hostel Fees</h3>
        </div>
        <div className='card-body'>
          <p>Hostel fee management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const HostelFeesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Hostel Fees</PageTitle>
      <HostelFees />
    </>
  )
}

export { HostelFeesWrapper }
