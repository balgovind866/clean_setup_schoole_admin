import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Classes: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Classes PAGE_TITLE Sections</h3>
        </div>
        <div className='card-body'>
          <p>Class and section management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ClassesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Classes PAGE_TITLE Sections</PageTitle>
      <Classes />
    </>
  )
}

export { ClassesWrapper }
