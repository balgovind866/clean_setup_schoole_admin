import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const CustomReports: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Custom Reports</h3>
        </div>
        <div className='card-body'>
          <p>Custom report builder - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const CustomReportsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Custom Reports</PageTitle>
      <CustomReports />
    </>
  )
}

export { CustomReportsWrapper }
