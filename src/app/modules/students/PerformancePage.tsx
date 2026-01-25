import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const PerformancePage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Student Performance</h3>
                </div>
                <div className='card-body'>
                    <p>Student performance and grades page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const PerformanceWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Performance</PageTitle>
            <PerformancePage />
        </>
    )
}

export { PerformanceWrapper }
