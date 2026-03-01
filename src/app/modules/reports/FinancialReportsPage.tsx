import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const FinancialReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Financial Reports</h3>
        </div>
        <div className='card-body'>
          <p>Fee and expense reports - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const FinancialReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Financial Reports</PageTitle>
      <FinancialReports />
    </>
  )
}

export { FinancialReportsWrapper }
