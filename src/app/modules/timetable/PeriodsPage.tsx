import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Periods: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Periods</h3>
        </div>
        <div className='card-body'>
          <p>Period and break management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const PeriodsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Periods</PageTitle>
      <Periods />
    </>
  )
}

export { PeriodsWrapper }
