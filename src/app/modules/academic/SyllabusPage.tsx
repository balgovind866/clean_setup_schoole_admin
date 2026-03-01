import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Syllabus: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Syllabus</h3>
        </div>
        <div className='card-body'>
          <p>Curriculum management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SyllabusWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Syllabus</PageTitle>
      <Syllabus />
    </>
  )
}

export { SyllabusWrapper }
