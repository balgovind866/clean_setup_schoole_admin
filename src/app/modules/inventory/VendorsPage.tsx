import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Vendors: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Vendors</h3>
        </div>
        <div className='card-body'>
          <p>Vendor management system - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const VendorsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Vendors</PageTitle>
      <Vendors />
    </>
  )
}

export { VendorsWrapper }
