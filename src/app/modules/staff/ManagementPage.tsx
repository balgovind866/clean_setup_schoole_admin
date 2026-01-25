import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const ManagementPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Staff Management</h3>
                </div>
                <div className='card-body'>
                    <p>Staff management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const ManagementWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Staff Management</PageTitle>
            <ManagementPage />
        </>
    )
}

export { ManagementWrapper }
