import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Tax: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Tax</h3>
        </div>
        <div className='card-body'>
          <p>Tax calculations and deductions - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const TaxWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Tax</PageTitle>
      <Tax />
    </>
  )
}

export { TaxWrapper }
