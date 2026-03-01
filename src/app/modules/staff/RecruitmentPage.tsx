import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Recruitment: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Recruitment</h3>
        </div>
        <div className='card-body'>
          <p>Job postings and onboarding - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const RecruitmentWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Recruitment</PageTitle>
      <Recruitment />
    </>
  )
}

export { RecruitmentWrapper }
