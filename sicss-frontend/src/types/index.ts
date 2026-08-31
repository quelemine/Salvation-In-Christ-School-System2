export interface User {
  id: number;
  user_code?: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role?: Role;
  phone?: string;
  address?: string;
  profile_photo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
}

export interface Division {
  id: number;
  name: string;
  slug: string;
  description?: string;
  order: number;
  is_active: boolean;
}

export interface Class {
  id: number;
  uuid: string;
  division_id: number;
  name: string;
  slug: string;
  section?: string;
  description?: string;
  capacity: number;
  order: number;
  is_active: boolean;
  division?: Division;
}

export interface Student {
  id: number;
  uuid: string;
  student_id: string;
  class_id?: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  parent_guardian_email?: string;
  phone?: string;
  address?: string;
  photo?: string;
  admission_date: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  class?: Class;
  user?: User;
}

export interface Teacher {
  id: number;
  uuid: string;
  user_id?: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  photo?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  hire_date: string;
  qualifications?: string;
  specialization?: string;
  status: 'active' | 'inactive' | 'on_leave';
  user?: User;
}

export interface Subject {
  id: number;
  uuid: string;
  code: string;
  name: string;
  slug: string;
  description?: string;
  credits: string;
  order: number;
  is_active: boolean;
}

export interface Attendance {
  id: number;
  uuid: string;
  student_id: number;
  class_id: number;
  teacher_id?: number;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
  student?: Student;
  class?: Class;
  teacher?: Teacher;
}

export interface Grade {
  id: number;
  uuid: string;
  student_id: number;
  subject_id: number;
  teacher_id?: number;
  term: string;
  academic_year: string;
  score: number;
  grade: string;
  remarks?: string;
  student?: Student;
  subject?: Subject;
  teacher?: Teacher;
}

export interface Assignment {
  id: number;
  uuid: string;
  subject_id: number;
  class_id: number;
  teacher_id?: number;
  title: string;
  description?: string;
  due_date: string;
  status: 'draft' | 'published' | 'closed';
  subject?: Subject;
  class?: Class;
  teacher?: Teacher;
}

export interface StudentComment {
  id: number;
  uuid: string;
  student_id: number;
  teacher_id?: number;
  academic_year: string;
  term: string;
  comment_type: 'academic' | 'behavior' | 'general';
  comment: string;
  student?: Student;
  teacher?: Teacher;
}

export interface Fee {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  amount_lrd?: number;
  amount_usd?: number;
  class_id?: number;
  academic_year: string;
  status: 'active' | 'inactive';
  is_mandatory: boolean;
  due_date?: string;
  class?: Class;
}

export interface Payment {
  id: number;
  uuid: string;
  student_id: number;
  fee_id: number;
  amount: number;
  currency: 'USD' | 'LRD';
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other';
  reference_number?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  recorded_by?: number;
  student?: Student;
  fee?: Fee;
}

export interface Receipt {
  id: number;
  uuid: string;
  receipt_number: string;
  payment_id: number;
  student_id: number;
  total_amount: number;
  currency: 'USD' | 'LRD';
  receipt_date: string;
  generated_by?: number;
  notes?: string;
  payment?: Payment;
  student?: Student;
}

export interface Device {
  id: number;
  device_uuid: string;
  user_id?: number;
  device_name?: string;
  platform?: string;
  platform_version?: string;
  app_version?: string;
  last_sync_at?: string;
  is_active: boolean;
}

export interface SyncLog {
  id: number;
  user_id?: number;
  device_uuid?: string;
  entity_type: string;
  entity_uuid: string;
  action: 'create' | 'update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';
  error_message?: string;
  data?: any;
  created_at: string;
  updated_at: string;
}

export interface SyncChange {
  entity_type: string;
  entity_uuid: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  version?: number;
  updated_at?: string;
}

export interface SyncPushRequest {
  device_uuid: string;
  device_name?: string;
  platform?: string;
  platform_version?: string;
  app_version?: string;
  changes: SyncChange[];
}

export interface SyncPushResponse {
  device_id: number;
  processed: number;
  results: Array<{
    entity_type: string;
    entity_uuid: string;
    action: string;
    status: string;
    data?: any;
    error?: string;
  }>;
  conflicts: any[];
}

export interface SyncPullRequest {
  device_uuid: string;
  last_sync_at?: string;
}

export interface SyncPullResponse {
  last_sync_at: string;
  changes: SyncChange[];
  total: number;
}

export interface SyncStatusResponse {
  device_uuid: string;
  last_sync_at?: string;
  pending_records: number;
  failed_records: number;
  conflicts: number;
  device_active: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
