import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Calendar: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Academic Calendar</h3>
        </div>
        <div className='card-body'>
          <p>Academic year calendar - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const CalendarWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Academic Calendar</PageTitle>
      <Calendar />
    </>
  )
}

export { CalendarWrapper }
