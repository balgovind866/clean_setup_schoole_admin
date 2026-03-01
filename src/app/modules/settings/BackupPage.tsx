import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Backup: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Backup PAGE_TITLE Security</h3>
        </div>
        <div className='card-body'>
          <p>Data backup and security settings - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const BackupWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Backup PAGE_TITLE Security</PageTitle>
      <Backup />
    </>
  )
}

export { BackupWrapper }
