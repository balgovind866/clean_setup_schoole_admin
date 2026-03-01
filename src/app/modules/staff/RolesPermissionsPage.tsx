import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const RolesPermissions: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Roles PAGE_TITLE Permissions</h3>
        </div>
        <div className='card-body'>
          <p>Staff access control - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const RolesPermissionsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Roles PAGE_TITLE Permissions</PageTitle>
      <RolesPermissions />
    </>
  )
}

export { RolesPermissionsWrapper }
