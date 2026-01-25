import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const AttendancePage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Student Attendance</h3>
                </div>
                <div className='card-body'>
                    <p>Student attendance tracking page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const AttendanceWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Attendance</PageTitle>
            <AttendancePage />
        </>
    )
}

export { AttendanceWrapper }
