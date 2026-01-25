import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const SessionsClassesPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Sessions & Classes</h3>
                </div>
                <div className='card-body'>
                    <p>Sessions and classes management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const SessionsClassesWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Sessions & Classes</PageTitle>
            <SessionsClassesPage />
        </>
    )
}

export { SessionsClassesWrapper }
