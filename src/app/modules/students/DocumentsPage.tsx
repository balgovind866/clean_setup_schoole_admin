import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const DocumentsPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Student Documents</h3>
                </div>
                <div className='card-body'>
                    <p>Student documents management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const DocumentsWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Documents</PageTitle>
            <DocumentsPage />
        </>
    )
}

export { DocumentsWrapper }
