import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Exams: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Exams</h3>
        </div>
        <div className='card-body'>
          <p>Exam creation and scheduling - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ExamsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Exams</PageTitle>
      <Exams />
    </>
  )
}

export { ExamsWrapper }
