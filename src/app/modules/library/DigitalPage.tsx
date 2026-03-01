import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Digital: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Digital Resources</h3>
        </div>
        <div className='card-body'>
          <p>E-books and digital library - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const DigitalWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Digital Resources</PageTitle>
      <Digital />
    </>
  )
}

export { DigitalWrapper }
