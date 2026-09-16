import api from './api';
import type { ApiResponse } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Core types
// ─────────────────────────────────────────────────────────────────────────────

export interface Teacher {
  id: number;
  uuid?: string;
  user_id?: number | null;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  photo?: string | null;
  credential_image_path?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  hire_date?: string | null;
  qualifications?: string | null;
  specialization?: string | null;
  subject_specialization?: string | null;
  status?: 'active' | 'inactive' | 'on_leave';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  salary_structure_id?: number | null;
  salary_structure?: SalaryStructure | null;
  // Relations loaded by TeacherController
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    user_code?: string;
    role?: { id: number; name: string; slug: string };
  } | null;
  sponsored_class?: { id: number; name: string; section?: string | null } | null;
  classes?: Array<{ id: number; name: string; section?: string | null }>;
  subject_class_assignments?: Array<{
    id: number;
    subject_id: number;
    class_id: number;
    subject?: { id: number; name: string; code?: string };
    class?: { id: number; name: string; section?: string | null };
  }>;
}

/** Shape returned by TeacherAssignmentController@allTeachers */
export interface TeacherSummary {
  id: number;
  name: string;
  employee_id: string;
  email: string;
  system_role: string | null;
  system_role_slug: string | null;
  is_subject_teacher: boolean;
  is_class_sponsor: boolean;
  subject_count: number;
  sponsored_class: string | null;
}

export interface SubjectAssignment {
  id: number;
  subject_id: number;
  subject_name: string | null;
  class_id: number;
  class_name: string | null;
}

export interface ClassSponsorship {
  class_id: number;
  class_name: string;
}

export interface TeacherAssignments {
  teacher: {
    id: number;
    name: string;
    employee_id: string;
    system_role: string | null;
    system_role_slug: string | null;
  };
  subject_assignments: SubjectAssignment[];
  class_sponsorship: ClassSponsorship | null;
}

export interface SalaryStructure {
  id: number;
  name: string;
  employment_type: 'self_contained' | 'part_time';
  role_title: string;
  monthly_salary: number | string;
  currency: 'LRD' | 'USD';
  is_active: boolean;
  notes?: string | null;
}

export interface TeacherPayroll {
  id: number;
  teacher_id: number;
  payroll_month: string;
  role_title: string;
  employment_type: 'self_contained' | 'part_time';
  amount: number | string;
  base_amount?: number | string | null;
  deduction_amount?: number | string;
  late_count?: number;
  absent_count?: number;
  currency: 'LRD' | 'USD';
  status: 'pending' | 'paid';
  paid_at?: string | null;
  notes?: string | null;
  teacher?: Teacher;
  salary_structure?: SalaryStructure | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Teacher CRUD — hits TeacherController (public + admin-only CRUD)
// ─────────────────────────────────────────────────────────────────────────────

export const teacherService = {
  /** Public endpoint — returns paginated list, all authenticated users */
  getAll: async () => {
    const response = await api.get('/teachers');
    return response.data;               // {data: Teacher[], ...pagination} or Teacher[]
  },

  getById: async (id: number): Promise<Teacher> => {
    const response = await api.get<ApiResponse<Teacher>>(`/teachers/${id}`);
    return response.data.data ?? (response.data as unknown as Teacher);
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Assignment management — all hit TeacherAssignmentController (admin only)
// ─────────────────────────────────────────────────────────────────────────────

export const teacherAssignmentService = {
  /**
   * GET /teachers  (admin scope → TeacherAssignmentController@allTeachers)
   * Returns the summary list used in the admin teacher table.
   */
  getAllWithAssignments: async (): Promise<TeacherSummary[]> => {
    const response = await api.get<TeacherSummary[]>('/teachers');
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * GET /teachers/{id}/assignments
   * Full assignment detail for a single teacher.
   */
  getAssignments: async (teacherId: number): Promise<TeacherAssignments> => {
    const response = await api.get<TeacherAssignments>(`/teachers/${teacherId}/assignments`);
    return response.data;
  },

  /**
   * POST /teachers/{id}/assign-subject
   * Assign a subject+class to a teacher.
   */
  assignSubject: async (
    teacherId: number,
    subjectId: number,
    classId: number,
  ): Promise<{ message: string }> => {
    const response = await api.post(`/teachers/${teacherId}/assign-subject`, {
      subject_id: subjectId,
      class_id: classId,
    });
    return response.data;
  },

  /**
   * DELETE /teachers/{id}/subject-assignments/{assignmentId}
   * Remove a subject assignment from a teacher.
   */
  removeSubjectAssignment: async (
    teacherId: number,
    assignmentId: number,
  ): Promise<{ message: string }> => {
    const response = await api.delete(
      `/teachers/${teacherId}/subject-assignments/${assignmentId}`,
    );
    return response.data;
  },

  /**
   * POST /teachers/{id}/assign-class-sponsor
   * Make a teacher the sponsor of a class.
   */
  assignClassSponsor: async (
    teacherId: number,
    classId: number,
  ): Promise<{ message: string }> => {
    const response = await api.post(`/teachers/${teacherId}/assign-class-sponsor`, {
      class_id: classId,
    });
    return response.data;
  },

  /**
   * DELETE /teachers/{id}/class-sponsorship/{classId}
   * Remove class sponsorship from a teacher.
   */
  removeClassSponsor: async (
    teacherId: number,
    classId: number,
  ): Promise<{ message: string }> => {
    const response = await api.delete(
      `/teachers/${teacherId}/class-sponsorship/${classId}`,
    );
    return response.data;
  },

  /**
   * PUT /teachers/{id}/system-role
   * Change the system-level role of the teacher's linked user account.
   * Expects role_id (not slug).
   */
  changeSystemRole: async (
    teacherId: number,
    roleId: number,
  ): Promise<{ message: string; new_role: string }> => {
    const response = await api.put(`/teachers/${teacherId}/system-role`, {
      role_id: roleId,
    });
    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Payroll
// ─────────────────────────────────────────────────────────────────────────────

export const payrollService = {
  structures: async (): Promise<SalaryStructure[]> =>
    (await api.get<SalaryStructure[]>('/salary-structures')).data,

  createStructure: async (data: Omit<SalaryStructure, 'id'>) =>
    (await api.post<SalaryStructure>('/salary-structures', data)).data,

  updateStructure: async (id: number, data: Omit<SalaryStructure, 'id'>) =>
    (await api.put<SalaryStructure>(`/salary-structures/${id}`, data)).data,

  payrolls: async (month?: string) =>
    (await api.get<TeacherPayroll[]>('/teacher-payrolls', { params: month ? { month } : {} })).data,

  createPayroll: async (data: Record<string, unknown>) =>
    (await api.post<TeacherPayroll>('/teacher-payrolls', data)).data,

  markPaid: async (id: number) =>
    (await api.post<TeacherPayroll>(`/teacher-payrolls/${id}/mark-paid`)).data,

  mySalary: async () =>
    (
      await api.get<{
        monthly_salary: number | string | null;
        annual_salary: number;
        annual_salary_estimate: number | null;
        currency: 'LRD' | 'USD' | null;
        status: 'pending' | 'paid';
        role_title?: string | null;
      }>('/my-salary')
    ).data,
};
