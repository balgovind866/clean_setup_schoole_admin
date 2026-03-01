import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Lessons: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Lesson Plans</h3>
        </div>
        <div className='card-body'>
          <p>Lesson planning - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const LessonsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Lesson Plans</PageTitle>
      <Lessons />
    </>
  )
}

export { LessonsWrapper }
