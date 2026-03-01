import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Preferences: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Preferences</h3>
        </div>
        <div className='card-body'>
          <p>System settings and preferences - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const PreferencesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Preferences</PageTitle>
      <Preferences />
    </>
  )
}

export { PreferencesWrapper }
