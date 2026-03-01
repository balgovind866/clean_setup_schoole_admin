import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Assets: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Assets</h3>
        </div>
        <div className='card-body'>
          <p>School property tracking - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const AssetsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Assets</PageTitle>
      <Assets />
    </>
  )
}

export { AssetsWrapper }
