import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const AcademicYear: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Academic Year</h3>
        </div>
        <div className='card-body'>
          <p>Academic year setup and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const AcademicYearWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Academic Year</PageTitle>
      <AcademicYear />
    </>
  )
}

export { AcademicYearWrapper }
