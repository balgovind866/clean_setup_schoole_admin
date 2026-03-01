import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const ExamSchedule: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Exam Schedule</h3>
        </div>
        <div className='card-body'>
          <p>Exam planning and scheduling - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ExamScheduleWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Exam Schedule</PageTitle>
      <ExamSchedule />
    </>
  )
}

export { ExamScheduleWrapper }
