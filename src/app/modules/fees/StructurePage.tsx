import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Structure: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Fee Structure</h3>
        </div>
        <div className='card-body'>
          <p>Fee categories and amounts setup - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const StructureWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Fee Structure</PageTitle>
      <Structure />
    </>
  )
}

export { StructureWrapper }
