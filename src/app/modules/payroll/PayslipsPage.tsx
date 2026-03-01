import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const Payslips: FC = () => (
  <>
    <ToolbarWrapper />
    <Content>
      <div className='card'>
        <div className='card-header'>
          <h3 className='card-title'>Payslips</h3>
        </div>
        <div className='card-body'>
          <p>Payslip generation and distribution - Coming soon</p>
        </div>
      </div>
    </Content>
  </>
)

const PayslipsWrapper: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>Payslips</PageTitle>
      <Payslips />
    </>
  )
}

export { PayslipsWrapper }
