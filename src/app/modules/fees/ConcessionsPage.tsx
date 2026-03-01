import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Concessions: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Concessions</h3>
        </div>
        <div className='card-body'>
          <p>Discounts and scholarships - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ConcessionsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Concessions</PageTitle>
      <Concessions />
    </>
  )
}

export { ConcessionsWrapper }
