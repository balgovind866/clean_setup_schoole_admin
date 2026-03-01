import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Mapping: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Teacher Mapping</h3>
        </div>
        <div className='card-body'>
          <p>Teacher-subject-class assignments - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const MappingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Teacher Mapping</PageTitle>
      <Mapping />
    </>
  )
}

export { MappingWrapper }
