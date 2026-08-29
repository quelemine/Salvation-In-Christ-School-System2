import api from './api';
export type TeacherAttendance = { id: number; teacher_id?: number | null; user_id?: number; attendance_date: string; attendance_type: 'working_day' | 'meeting'; status: 'present' | 'late' | 'absent' | 'excused'; remarks?: string; teacher?: { first_name: string; last_name: string; employee_id: string }; user?: { first_name: string; last_name: string; email: string } };
export type TeacherAttendanceSettings = { late_deduction_percent: number; absent_deduction_percent: number };
export const teacherAttendanceService = {
  staff: async () => (await api.get<Array<{ id: number; first_name: string; last_name: string; email: string; role?: { name: string; slug: string } }>>('/staff-attendance-members')).data,
  records: async (date: string, attendance_type: string) => (await api.get<TeacherAttendance[]>('/teacher-attendance', { params: { date, attendance_type } })).data,
  saveBulk: async (data: Record<string, unknown>) => (await api.post<TeacherAttendance[]>('/teacher-attendance/bulk', data)).data,
  settings: async () => (await api.get<TeacherAttendanceSettings>('/teacher-attendance-settings')).data,
  updateSettings: async (data: TeacherAttendanceSettings) => (await api.put<TeacherAttendanceSettings>('/teacher-attendance-settings', data)).data,
  updateIndividualSettings: async (userId: number, data: TeacherAttendanceSettings) => (await api.put<TeacherAttendanceSettings>(`/teacher-attendance-settings/${userId}`, data)).data,
  mine: async () => (await api.get<{ today: TeacherAttendance | null; month: Record<string, number> }>('/my-teacher-attendance')).data,
};
