import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const ClassTimetable: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Class Timetable</h3>
        </div>
        <div className='card-body'>
          <p>Class-wise timetable creation - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ClassTimetableWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Class Timetable</PageTitle>
      <ClassTimetable />
    </>
  )
}

export { ClassTimetableWrapper }
