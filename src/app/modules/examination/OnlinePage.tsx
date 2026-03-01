import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const OnlineExams: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Online Exams</h3>
        </div>
        <div className='card-body'>
          <p>Digital examination system - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const OnlineExamsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Online Exams</PageTitle>
      <OnlineExams />
    </>
  )
}

export { OnlineExamsWrapper }
