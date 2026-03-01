import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Allocation: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Allocation</h3>
        </div>
        <div className='card-body'>
          <p>Student transport assignment - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const AllocationWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Allocation</PageTitle>
      <Allocation />
    </>
  )
}

export { AllocationWrapper }
