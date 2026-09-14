import api from './api';

export const idCardService = {
  generateStudentIdCard: async (studentId: string): Promise<string> => {
    const response = await api.post('/id-cards/student', { student_id: studentId });
    return response.data;
  },

  generateTeacherIdCard: async (teacherId: string): Promise<string> => {
    const response = await api.post('/id-cards/teacher', { teacher_id: teacherId });
    return response.data;
  },
};
