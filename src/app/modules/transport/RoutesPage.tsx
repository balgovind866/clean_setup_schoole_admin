import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Routes: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Routes</h3>
        </div>
        <div className='card-body'>
          <p>Route planning and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const RoutesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Routes</PageTitle>
      <Routes />
    </>
  )
}

export { RoutesWrapper }
