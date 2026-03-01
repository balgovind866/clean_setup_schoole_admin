import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Results: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Results</h3>
        </div>
        <div className='card-body'>
          <p>Result analysis and statistics - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ResultsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Results</PageTitle>
      <Results />
    </>
  )
}

export { ResultsWrapper }
