import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Maintenance: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Maintenance</h3>
        </div>
        <div className='card-body'>
          <p>Equipment maintenance tracking - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const MaintenanceWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Maintenance</PageTitle>
      <Maintenance />
    </>
  )
}

export { MaintenanceWrapper }
