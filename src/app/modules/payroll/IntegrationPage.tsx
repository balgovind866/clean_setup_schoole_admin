import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Integration: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Integration</h3>
        </div>
        <div className='card-body'>
          <p>Leave and attendance integration - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const IntegrationWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Integration</PageTitle>
      <Integration />
    </>
  )
}

export { IntegrationWrapper }
