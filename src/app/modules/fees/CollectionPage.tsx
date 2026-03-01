import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Collection: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Fee Collection</h3>
        </div>
        <div className='card-body'>
          <p>Fee payment processing - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const CollectionWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Fee Collection</PageTitle>
      <Collection />
    </>
  )
}

export { CollectionWrapper }
