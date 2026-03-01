import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const FeeReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Fee Reports</h3>
        </div>
        <div className='card-body'>
          <p>Financial reports and analytics - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const FeeReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Fee Reports</PageTitle>
      <FeeReports />
    </>
  )
}

export { FeeReportsWrapper }
