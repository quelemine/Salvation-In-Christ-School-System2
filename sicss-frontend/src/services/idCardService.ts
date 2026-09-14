import api from './api';

export const idCardService = {
  generateStudentIdCard: async (studentId: number): Promise<string> => {
    const response = await api.post('/id-cards/student', { student_id: studentId });
    return response.data;
  },

  generateTeacherIdCard: async (teacherId: number): Promise<string> => {
    const response = await api.post('/id-cards/teacher', { teacher_id: teacherId });
    return response.data;
  },
};
