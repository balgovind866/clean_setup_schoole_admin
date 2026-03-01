import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Teachers: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Teachers</h3>
        </div>
        <div className='card-body'>
          <p>Teacher profiles and management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const TeachersWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Teachers</PageTitle>
      <Teachers />
    </>
  )
}

export { TeachersWrapper }
