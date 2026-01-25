import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const RecordsPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Staff Records</h3>
                </div>
                <div className='card-body'>
                    <p>Staff records management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const RecordsWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Staff Records</PageTitle>
            <RecordsPage />
        </>
    )
}

export { RecordsWrapper }
