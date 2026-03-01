import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const SalaryStructure: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Salary Structure</h3>
        </div>
        <div className='card-body'>
          <p>Pay scales and components - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SalaryStructureWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Salary Structure</PageTitle>
      <SalaryStructure />
    </>
  )
}

export { SalaryStructureWrapper }
