import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const IssueReturn: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>PAGE_TITLE</h3>
        </div>
        <div className='card-body'>
          <p>Book lending and returns - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const IssueReturnWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>PAGE_TITLE</PageTitle>
      <IssueReturn />
    </>
  )
}

export { IssueReturnWrapper }
