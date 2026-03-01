import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Marks: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Marks Entry</h3>
        </div>
        <div className='card-body'>
          <p>Grade and marks input - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const MarksWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Marks Entry</PageTitle>
      <Marks />
    </>
  )
}

export { MarksWrapper }
