
import { FC } from 'react'
import { KTIcon } from '../../../../_metronic/helpers'
import { DUMMY_STUDENTS, Student } from '../StudentModels'

const StudentList: FC = () => {
    return (
        <div className='card mb-5 mb-xl-8'>
            {/* begin::Header */}
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Student List</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>
                        {DUMMY_STUDENTS.length} Students
                    </span>
                </h3>
                <div className='card-toolbar'>
                    <a href='#' className='btn btn-sm btn-light-primary'>
                        <KTIcon iconName='plus' className='fs-2' />
                        New Student
                    </a>
                </div>
            </div>
            {/* end::Header */}
            {/* begin::Body */}
            <div className='card-body py-3'>
                {/* begin::Table container */}
                <div className='table-responsive'>
                    {/* begin::Table */}
                    <table className='table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3'>
                        {/* begin::Table head */}
                        <thead>
                            <tr className='fw-bold text-muted'>
                                <th className='w-25px'>
                                    <div className='form-check form-check-sm form-check-custom form-check-solid'>
                                        <input
                                            className='form-check-input'
                                            type='checkbox'
                                            value='1'
                                            data-kt-check='true'
                                            data-kt-check-target='.widget-13-check'
                                        />
                                    </div>
                                </th>
                                <th className='min-w-150px'>Student Name</th>
                                <th className='min-w-140px'>Roll Number</th>
                                <th className='min-w-120px'>Class</th>
                                <th className='min-w-120px'>Section</th>
                                <th className='min-w-120px'>Email</th>
                                <th className='min-w-120px'>Actions</th>
                            </tr>
                        </thead>
                        {/* end::Table head */}
                        {/* begin::Table body */}
                        <tbody>
                            {DUMMY_STUDENTS.map((student: Student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className='form-check form-check-sm form-check-custom form-check-solid'>
                                            <input className='form-check-input widget-13-check' type='checkbox' value='1' />
                                        </div>
                                    </td>
                                    <td>
                                        <div className='text-dark fw-bold text-hover-primary fs-6'>{student.name}</div>
                                    </td>
                                    <td>
                                        <div className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                            {student.rollNumber}
                                        </div>
                                    </td>
                                    <td>
                                        <div className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                            {student.class}
                                        </div>
                                    </td>
                                    <td>
                                        <div className='text-dark fw-bold text-hover-primary d-block mb-1 fs-6'>
                                            {student.section}
                                        </div>
                                    </td>
                                    <td className='text-dark fw-bold text-hover-primary fs-6'>{student.email}</td>
                                    <td>
                                        <a href='#' className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'>
                                            <KTIcon iconName='pencil' className='fs-3' />
                                        </a>
                                        <a href='#' className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'>
                                            <KTIcon iconName='trash' className='fs-3' />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {/* end::Table body */}
                    </table>
                    {/* end::Table */}
                </div>
                {/* end::Table container */}
            </div>
            {/* begin::Body */}
        </div>
    )
}

export { StudentList }
