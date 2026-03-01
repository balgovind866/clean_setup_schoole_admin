import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Resources: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Resources</h3>
        </div>
        <div className='card-body'>
          <p>Room and resource allocation - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ResourcesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Resources</PageTitle>
      <Resources />
    </>
  )
}

export { ResourcesWrapper }
