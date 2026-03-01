import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const StaffDocuments: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Documents</h3>
        </div>
        <div className='card-body'>
          <p>Staff certificates and contracts - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const StaffDocumentsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Documents</PageTitle>
      <StaffDocuments />
    </>
  )
}

export { StaffDocumentsWrapper }
