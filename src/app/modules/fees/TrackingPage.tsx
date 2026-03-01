import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Tracking: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Payment Tracking</h3>
        </div>
        <div className='card-body'>
          <p>Payment status monitoring - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const TrackingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Payment Tracking</PageTitle>
      <Tracking />
    </>
  )
}

export { TrackingWrapper }
