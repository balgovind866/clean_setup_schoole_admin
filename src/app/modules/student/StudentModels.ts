export interface Student {
    id: number
    name: string
    rollNumber: string
    class: string
    section: string
    email: string
    phone?: string
    dob?: string
}

export const DUMMY_STUDENTS: Student[] = [
    {
        id: 1,
        name: 'John Doe',
        rollNumber: '1001',
        class: '10th',
        section: 'A',
        email: 'john@example.com',
        phone: '9876543210',
        dob: '2008-01-15',
    },
    {
        id: 2,
        name: 'Jane Smith',
        rollNumber: '1002',
        class: '10th',
        section: 'A',
        email: 'jane@example.com',
        phone: '9876543211',
        dob: '2008-02-20',
    },
    {
        id: 3,
        name: 'Alice Johnson',
        rollNumber: '1003',
        class: '10th',
        section: 'B',
        email: 'alice@example.com',
        phone: '9876543212',
        dob: '2008-03-25',
    },
    {
        id: 4,
        name: 'Bob Brown',
        rollNumber: '1004',
        class: '10th',
        section: 'B',
        email: 'bob@example.com',
        phone: '9876543213',
        dob: '2008-04-30',
    },
]
