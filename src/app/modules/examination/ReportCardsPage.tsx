import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const ReportCards: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Report Cards</h3>
        </div>
        <div className='card-body'>
          <p>Report card generation - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ReportCardsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Report Cards</PageTitle>
      <ReportCards />
    </>
  )
}

export { ReportCardsWrapper }
