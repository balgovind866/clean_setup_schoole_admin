import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

const StaffAttendancePage: FC = () => (
    <>
        <ToolbarWrapper />
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Staff Attendance</h3>
                </div>
                <div className='card-body'>
                    <p>Staff attendance tracking page - Coming soon</p>
                </div>
            </div>
        </Content>
    </>
)

const StaffAttendanceWrapper: FC = () => {
    return (
        <>
            <PageTitle breadcrumbs={[]}>Staff Attendance</PageTitle>
            <StaffAttendancePage />
        </>
    )
}

export { StaffAttendanceWrapper }
