import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Fines: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Fines</h3>
        </div>
        <div className='card-body'>
          <p>Late return fine management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const FinesWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Fines</PageTitle>
      <Fines />
    </>
  )
}

export { FinesWrapper }
