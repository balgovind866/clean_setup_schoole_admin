import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Supplies: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Supplies</h3>
        </div>
        <div className='card-body'>
          <p>Stationery and supplies management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SuppliesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Supplies</PageTitle>
      <Supplies />
    </>
  )
}

export { SuppliesWrapper }
