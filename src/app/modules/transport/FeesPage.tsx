import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const TransportFees: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Transport Fees</h3>
        </div>
        <div className='card-body'>
          <p>Transport fee management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const TransportFeesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Transport Fees</PageTitle>
      <TransportFees />
    </>
  )
}

export { TransportFeesWrapper }
