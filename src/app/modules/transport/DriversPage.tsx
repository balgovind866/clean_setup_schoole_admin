import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Drivers: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Drivers</h3>
        </div>
        <div className='card-body'>
          <p>Driver and conductor details - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const DriversWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Drivers</PageTitle>
      <Drivers />
    </>
  )
}

export { DriversWrapper }
