import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const EnrollmentPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Student Enrollment</h3>
                </div>
                <div className='card-body'>
                    <p>Student enrollment management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const EnrollmentWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Enrollment</PageTitle>
            <EnrollmentPage />
        </>
    )
}

export { EnrollmentWrapper }
