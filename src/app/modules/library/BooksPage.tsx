import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Books: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Books</h3>
        </div>
        <div className='card-body'>
          <p>Book inventory management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const BooksWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Books</PageTitle>
      <Books />
    </>
  )
}

export { BooksWrapper }
