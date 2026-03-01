import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Roles: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Roles PAGE_TITLE Permissions</h3>
        </div>
        <div className='card-body'>
          <p>User access control and permissions - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const RolesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Roles PAGE_TITLE Permissions</PageTitle>
      <Roles />
    </>
  )
}

export { RolesWrapper }
