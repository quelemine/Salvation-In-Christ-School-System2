import api from './api';

export interface ReportCardTemplate {
  id: number;
  name: string;
  slug: string;
  grade_level_type: 'nursery_kg' | 'primary' | 'junior_high' | 'senior_high';
  assessment_periods: string[];
  grading_method: 'numeric' | 'letter';
  grading_scale: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningArea {
  id: number;
  name: string;
  code: string | null;
  grade_level_type: 'nursery_kg' | 'primary' | 'junior_high' | 'senior_high';
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const reportCardTemplateService = {
  // Report Card Templates
  getAllTemplates: async (): Promise<ReportCardTemplate[]> => {
    const res = await api.get<ReportCardTemplate[]>('/report-card-templates');
    return res.data;
  },

  getTemplate: async (id: number): Promise<ReportCardTemplate> => {
    const res = await api.get<ReportCardTemplate>(`/report-card-templates/${id}`);
    return res.data;
  },

  createTemplate: async (data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate> => {
    const res = await api.post<ReportCardTemplate>('/report-card-templates', data);
    return res.data;
  },

  updateTemplate: async (id: number, data: Partial<ReportCardTemplate>): Promise<ReportCardTemplate> => {
    const res = await api.put<ReportCardTemplate>(`/report-card-templates/${id}`, data);
    return res.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/report-card-templates/${id}`);
  },

  // Learning Areas
  getLearningAreas: async (gradeLevelType?: string): Promise<LearningArea[]> => {
    const params = gradeLevelType ? { grade_level_type: gradeLevelType } : {};
    const res = await api.get<LearningArea[]>('/learning-areas', { params });
    return res.data;
  },

  getLearningArea: async (id: number): Promise<LearningArea> => {
    const res = await api.get<LearningArea>(`/learning-areas/${id}`);
    return res.data;
  },

  createLearningArea: async (data: Partial<LearningArea>): Promise<LearningArea> => {
    const res = await api.post<LearningArea>('/learning-areas', data);
    return res.data;
  },

  updateLearningArea: async (id: number, data: Partial<LearningArea>): Promise<LearningArea> => {
    const res = await api.put<LearningArea>(`/learning-areas/${id}`, data);
    return res.data;
  },

  deleteLearningArea: async (id: number): Promise<void> => {
    await api.delete(`/learning-areas/${id}`);
  },
};
