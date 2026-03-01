import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Mess: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Mess</h3>
        </div>
        <div className='card-body'>
          <p>Mess management system - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const MessWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Mess</PageTitle>
      <Mess />
    </>
  )
}

export { MessWrapper }
