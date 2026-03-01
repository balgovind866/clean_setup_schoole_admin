import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Announcements: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Announcements</h3>
        </div>
        <div className='card-body'>
          <p>School announcements and circulars - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const AnnouncementsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Announcements</PageTitle>
      <Announcements />
    </>
  )
}

export { AnnouncementsWrapper }
