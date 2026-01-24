
import { Navigate, Route, Routes, Outlet } from 'react-router-dom'
import { PageLink, PageTitle } from '../../../_metronic/layout/core'
import { StudentList } from './components/StudentList'

const studentsBreadcrumbs: Array<PageLink> = [
    {
        title: 'Student Management',
        path: '/student/list',
        isSeparator: false,
        isActive: false,
    },
    {
        title: '',
        path: '',
        isSeparator: true,
        isActive: false,
    },
]

const StudentsPage = () => {
    return (
        <Routes>
            <Route
                element={
                    <>
                        <Outlet />
                    </>
                }
            >
                <Route
                    path='list'
                    element={
                        <>
                            <PageTitle breadcrumbs={studentsBreadcrumbs}>Student List</PageTitle>
                            <StudentList />
                        </>
                    }
                />
                <Route index element={<Navigate to='/student/list' />} />
            </Route>
        </Routes>
    )
}

export default StudentsPage
