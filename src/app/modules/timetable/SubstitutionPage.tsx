import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Substitution: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Substitution</h3>
        </div>
        <div className='card-body'>
          <p>Teacher substitution management - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const SubstitutionWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Substitution</PageTitle>
      <Substitution />
    </>
  )
}

export { SubstitutionWrapper }
