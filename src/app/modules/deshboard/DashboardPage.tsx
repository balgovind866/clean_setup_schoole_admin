import { FC } from 'react'
import { PageTitle } from '../../../_metronic/layout/core'
import { ToolbarWrapper } from '../../../_metronic/layout/components/toolbar'
import { Content } from '../../../_metronic/layout/components/content'

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 1, admission_number: "ADM-2024-0001", first_name: "Aarav", last_name: "Sharma", gender: "male", class: { name: "Class 10", section: "A" }, status: "active" },
  { id: 2, admission_number: "ADM-2024-0002", first_name: "Priya", last_name: "Verma", gender: "female", class: { name: "Class 10", section: "A" }, status: "active" },
  { id: 3, admission_number: "ADM-2024-0003", first_name: "Rohan", last_name: "Gupta", gender: "male", class: { name: "Class 11", section: "B" }, status: "active" },
  { id: 4, admission_number: "ADM-2024-0004", first_name: "Ananya", last_name: "Singh", gender: "female", class: { name: "Class 9", section: "C" }, status: "transferred" },
];

const MOCK_CLASSES = [
  { id: 1, name: "Class 10", section: "A", grade: "10", capacity: 40, student_count: 38, teacher: "Ravi Kumar" },
  { id: 2, name: "Class 11", section: "B", grade: "11", capacity: 35, student_count: 32, teacher: "Meena Iyer" },
  { id: 3, name: "Class 9", section: "C", grade: "9", capacity: 45, student_count: 41, teacher: "Ajay Nair" },
];

const DashboardPage: FC = () => {
  return (
    <>
      <PageTitle breadcrumbs={[]}>School Dashboard</PageTitle>
      <ToolbarWrapper />
      <Content>
        {/* Stats Row */}
        <div className='row g-5 g-xl-10 mb-5 mb-xl-10'>
          <div className='col-md-3'>
            <div className='card card-flush h-md-100 bg-light-primary'>
              <div className='card-header pt-5'>
                <div className='card-title d-flex flex-column'>
                  <span className='fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2'>{MOCK_STUDENTS.length}</span>
                  <span className='text-gray-500 pt-1 fw-semibold fs-6'>Total Students</span>
                </div>
              </div>
            </div>
          </div>
          <div className='col-md-3'>
            <div className='card card-flush h-md-100 bg-light-info'>
              <div className='card-header pt-5'>
                <div className='card-title d-flex flex-column'>
                  <span className='fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2'>{MOCK_CLASSES.length}</span>
                  <span className='text-gray-500 pt-1 fw-semibold fs-6'>Total Classes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='row g-5 g-xl-10'>
          {/* Recent Students */}
          <div className='col-xl-6'>
            <div className='card card-flush h-xl-100'>
              <div className='card-header pt-7'>
                <h3 className='card-title align-items-start flex-column'>
                  <span className='card-label fw-bold text-gray-800'>Recent Students</span>
                  <span className='text-gray-400 mt-1 fw-semibold fs-6'>Latest admissions</span>
                </h3>
              </div>
              <div className='card-body pt-5'>
                {MOCK_STUDENTS.map(student => (
                  <div key={student.id} className='d-flex flex-stack mb-7'>
                    <div className='d-flex align-items-center me-3'>
                      <div className='symbol symbol-45px me-5'>
                        <span className={`symbol-label bg-light-${student.gender === 'male' ? 'primary' : 'warning'} text-${student.gender === 'male' ? 'primary' : 'warning'} fw-bold`}>
                          {student.first_name[0]}
                        </span>
                      </div>
                      <div className='flex-grow-1'>
                        <span className='text-gray-800 text-hover-primary fs-6 fw-bold'>{student.first_name} {student.last_name}</span>
                        <span className='text-gray-400 d-block fw-semibold'>{student.admission_number}</span>
                      </div>
                    </div>
                    <span className={`badge badge-light-${student.status === 'active' ? 'success' : 'info'}`}>{student.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Classes Overview */}
          <div className='col-xl-6'>
            <div className='card card-flush h-xl-100'>
              <div className='card-header pt-7'>
                <h3 className='card-title align-items-start flex-column'>
                  <span className='card-label fw-bold text-gray-800'>Classes Overview</span>
                  <span className='text-gray-400 mt-1 fw-semibold fs-6'>Current enrollment status</span>
                </h3>
              </div>
              <div className='card-body pt-5'>
                {MOCK_CLASSES.map(cls => (
                  <div key={cls.id} className='d-flex flex-stack mb-7'>
                    <div className='d-flex align-items-center me-3'>
                      <div className='symbol symbol-45px me-5'>
                        <span className='symbol-label bg-light-success text-success fw-bold'>{cls.grade}</span>
                      </div>
                      <div className='flex-grow-1'>
                        <span className='text-gray-800 text-hover-primary fs-6 fw-bold'>{cls.name} - {cls.section}</span>
                        <span className='text-gray-400 d-block fw-semibold'>Teacher: {cls.teacher}</span>
                      </div>
                    </div>
                    <div className='d-flex flex-column align-items-end'>
                      <span className='text-gray-800 fw-bold'>{cls.student_count} / {cls.capacity}</span>
                      <div className='h-5px mx-3 w-100px bg-light-success rounded'>
                        <div
                          className='bg-success rounded h-5px'
                          style={{ width: `${(cls.student_count / cls.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Content>
    </>
  )
}

export default DashboardPage
