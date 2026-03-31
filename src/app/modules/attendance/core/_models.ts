export interface StudentAttendanceRecord {
    student_id: number;
    first_name: string;
    last_name: string;
    mobile_number: string;
    enrollment_id: number;
    attendance_id: number | null;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | null;
    remark: string | null;
    attendance_mode: string | null;
    entry_time: string | null;
    exit_time: string | null;
}

export interface StudentAttendanceFetchResponse {
    success: boolean;
    message: string;
    data: {
        attendances: StudentAttendanceRecord[];
    };
}

export interface MarkStudentAttendancePayload {
    class_section_id: number;
    academic_session_id?: number | null;
    date: string; // YYYY-MM-DD
    students: {
        student_id: number;
        status: string;
        remark?: string | null;
    }[];
}

export interface StaffAttendanceRecord {
    staff_id: number;
    staff_type: 'TEACHER' | 'ADMIN';
    name: string;
    designation: string;
    attendance_id: number | null;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | null;
    remark: string | null;
    entry_time: string | null;
    exit_time: string | null;
}

export interface StaffAttendanceFetchResponse {
    success: boolean;
    message: string;
    data: {
        attendances: StaffAttendanceRecord[];
    };
}

export interface MarkStaffAttendancePayload {
    date: string; // YYYY-MM-DD
    staffList: {
        staff_id: number;
        staff_type: 'TEACHER' | 'ADMIN';
        status: string;
        remark?: string | null;
    }[];
}

export interface ClassMatrixStudent {
    student_id: number;
    name: string;
    attendance: Record<string, string>; // "YYYY-MM-DD": "STATUS"
    summary: {
        present: number;
        absent: number;
        late: number;
        leave: number;
        half_day: number;
    };
}

export interface ClassMonthlyMatrixResponse {
    success: boolean;
    message: string;
    data: {
        matrix_report: {
            class_section_id: string;
            month: number;
            year: number;
            matrix: ClassMatrixStudent[];
        };
    };
}

export interface StudentMonthlyRecord {
    id: number;
    student_id: number;
    class_section_id: number;
    academic_session_id: number;
    date: string;
    status: string;
    attendance_mode: string;
    entry_time: string | null;
    exit_time: string | null;
    remark: string | null;
}

export interface StudentMonthlyReportResponse {
    success: boolean;
    message: string;
    data: {
        report: {
            student_id: string;
            month: number;
            year: number;
            summary: {
                total_marked: number;
                present: number;
                absent: number;
                late: number;
                half_day: number;
                leave: number;
            };
            records: StudentMonthlyRecord[];
        };
    };
}
