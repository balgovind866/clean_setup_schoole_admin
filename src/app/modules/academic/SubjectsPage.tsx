import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Subjects: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Subjects</h3>
        </div>
        <div className='card-body'>
          <p>Subject creation and allocation - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SubjectsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Subjects</PageTitle>
      <Subjects />
    </>
  )
}

export { SubjectsWrapper }
