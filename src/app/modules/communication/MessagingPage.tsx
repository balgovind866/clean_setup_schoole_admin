import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Messaging: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Messaging</h3>
        </div>
        <div className='card-body'>
          <p>Parent-teacher messaging - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const MessagingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Messaging</PageTitle>
      <Messaging />
    </>
  )
}

export { MessagingWrapper }
