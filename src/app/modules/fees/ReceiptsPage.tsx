import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Receipts: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Receipts</h3>
        </div>
        <div className='card-body'>
          <p>Receipt generation and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ReceiptsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Receipts</PageTitle>
      <Receipts />
    </>
  )
}

export { ReceiptsWrapper }
