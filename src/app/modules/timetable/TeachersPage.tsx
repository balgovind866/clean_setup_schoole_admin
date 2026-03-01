import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const TeacherSchedule: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Teacher Schedule</h3>
        </div>
        <div className='card-body'>
          <p>Teacher timetable management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const TeacherScheduleWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Teacher Schedule</PageTitle>
      <TeacherSchedule />
    </>
  )
}

export { TeacherScheduleWrapper }
