import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Notifications: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Notifications</h3>
        </div>
        <div className='card-body'>
          <p>SMS and email notifications - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const NotificationsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Notifications</PageTitle>
      <Notifications />
    </>
  )
}

export { NotificationsWrapper }
