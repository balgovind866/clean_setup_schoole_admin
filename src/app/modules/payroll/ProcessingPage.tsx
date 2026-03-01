import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Processing: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Processing</h3>
        </div>
        <div className='card-body'>
          <p>Salary calculation and processing - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const ProcessingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Processing</PageTitle>
      <Processing />
    </>
  )
}

export { ProcessingWrapper }
