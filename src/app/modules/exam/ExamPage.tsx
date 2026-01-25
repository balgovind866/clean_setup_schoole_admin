import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const ExamPage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Exam</h3>
                </div>
                <div className='card-body'>
                    <p>Exam management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const ExamWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Exam</PageTitle>
            <ExamPage />
        </>
    )
}

export { ExamWrapper }
