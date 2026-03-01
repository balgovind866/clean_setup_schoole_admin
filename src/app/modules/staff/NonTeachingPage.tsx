import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const NonTeaching: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Non-Teaching Staff</h3>
        </div>
        <div className='card-body'>
          <p>Administrative and support staff - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const NonTeachingWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Non-Teaching Staff</PageTitle>
      <NonTeaching />
    </>
  )
}

export { NonTeachingWrapper }
