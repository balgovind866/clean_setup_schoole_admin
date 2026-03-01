import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Export: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Export</h3>
        </div>
        <div className='card-body'>
          <p>Data export tools - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ExportWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Export</PageTitle>
      <Export />
    </>
  )
}

export { ExportWrapper }
