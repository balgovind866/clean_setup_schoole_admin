import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const AdmissionPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Student Admission</h3>
                </div>
                <div className='card-body'>
                    <p>Student admission management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const AdmissionWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Admission</PageTitle>
            <AdmissionPage />
        </>
    )
}

export { AdmissionWrapper }
