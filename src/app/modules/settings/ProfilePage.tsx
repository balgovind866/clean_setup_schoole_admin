import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const SchoolProfile: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>School Profile</h3>
        </div>
        <div className='card-body'>
          <p>School information and details - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SchoolProfileWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>School Profile</PageTitle>
      <SchoolProfile />
    </>
  )
}

export { SchoolProfileWrapper }
