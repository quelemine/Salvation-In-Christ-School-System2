import api from './api';

export const certificateService = {
  generateCompletionCertificate: async (studentId: string, academicYear: string): Promise<string> => {
    const response = await api.post('/certificates/completion', { student_id: studentId, academic_year: academicYear });
    return response.data;
  },

  generateAchievementCertificate: async (data: {
    student_id: string;
    achievement_type: string;
    description?: string;
    date: string;
  }): Promise<string> => {
    const response = await api.post('/certificates/achievement', data);
    return response.data;
  },
};
