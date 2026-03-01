import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Vehicles: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Vehicles</h3>
        </div>
        <div className='card-body'>
          <p>Vehicle tracking and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const VehiclesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Vehicles</PageTitle>
      <Vehicles />
    </>
  )
}

export { VehiclesWrapper }
