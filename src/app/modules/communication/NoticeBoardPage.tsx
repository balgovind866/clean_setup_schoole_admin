import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const NoticeBoard: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Notice Board</h3>
        </div>
        <div className='card-body'>
          <p>Digital notice board - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const NoticeBoardWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Notice Board</PageTitle>
      <NoticeBoard />
    </>
  )
}

export { NoticeBoardWrapper }
