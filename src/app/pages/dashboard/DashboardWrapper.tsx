import { FC } from 'react'
import { useIntl } from 'react-intl'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const DashboardPage: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='row g-5 g-xl-10 mb-5 mb-xl-10'>
        <div className='col-xxl-12'>
          <div className='card card-flush h-xl-100'>
            <div className='card-header pt-5'>
              <h3 className='card-title align-items-start flex-column'>
                <span className='card-label fw-bold text-dark'>Welcome to Dashboard</span>
                <span className='text-gray-400 mt-1 fw-semibold fs-6'>Everything is clean and ready.</span>
              </h3>
            </div>
            <div className='card-body pt-0'>
              <p>Use the sidebar to navigate to the Student Section.</p>
            </div>
          </div>
        </div>
      </div>
    </Content>
  </>
)

const DashboardWrapper: FC = () => {
  const intl = useIntl()
  return (
    <>
      <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>
      <DashboardPage />
    </>
  )
}

export { DashboardWrapper }
