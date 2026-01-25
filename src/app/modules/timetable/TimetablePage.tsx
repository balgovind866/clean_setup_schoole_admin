import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const TimetablePage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Timetable</h3>
                </div>
                <div className='card-body'>
                    <p>Timetable management page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const TimetableWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Timetable</PageTitle>
            <TimetablePage />
        </>
    )
}

export { TimetableWrapper }
