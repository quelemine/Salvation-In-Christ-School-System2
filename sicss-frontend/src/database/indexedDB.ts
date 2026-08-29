import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  Attendance,
  Grade,
  Assignment,
  StudentComment,
  Fee,
  Payment,
  Receipt,
} from '../types';

interface SICSSDB extends DBSchema {
  users: {
    key: number;
    value: User;
    indexes: { 'by-uuid': string; 'by-email': string };
  };
  students: {
    key: number;
    value: Student;
    indexes: { 'by-uuid': string; 'by-student-id': string; 'by-class-id': number };
  };
  teachers: {
    key: number;
    value: Teacher;
    indexes: { 'by-uuid': string; 'by-employee-id': string };
  };
  classes: {
    key: number;
    value: Class;
    indexes: { 'by-uuid': string; 'by-division-id': number };
  };
  subjects: {
    key: number;
    value: Subject;
    indexes: { 'by-uuid': string; 'by-code': string };
  };
  attendance: {
    key: number;
    value: Attendance;
    indexes: { 'by-uuid': string; 'by-student-id': number; 'by-date': string };
  };
  grades: {
    key: number;
    value: Grade;
    indexes: { 'by-uuid': string; 'by-student-id': number; 'by-academic-year': string };
  };
  assignments: {
    key: number;
    value: Assignment;
    indexes: { 'by-uuid': string; 'by-class-id': number };
  };
  student_comments: {
    key: number;
    value: StudentComment;
    indexes: { 'by-uuid': string; 'by-student-id': number };
  };
  fees: {
    key: number;
    value: Fee;
    indexes: { 'by-uuid': string; 'by-academic-year': string };
  };
  payments: {
    key: number;
    value: Payment;
    indexes: { 'by-uuid': string; 'by-student-id': number };
  };
  receipts: {
    key: number;
    value: Receipt;
    indexes: { 'by-uuid': string; 'by-payment-id': number };
  };
  sync_queue: {
    key: number;
    value: {
      id: number;
      entity_type: string;
      entity_uuid: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      error_message?: string;
      created_at: string;
    };
    indexes: { 'by-status': string };
  };
}

let db: IDBPDatabase<SICSSDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<SICSSDB>> => {
  if (db) return db;

  db = await openDB<SICSSDB>('sicss-db', 1, {
    upgrade(db) {
      // Users
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-uuid', 'uuid', { unique: true });
        userStore.createIndex('by-email', 'email', { unique: true });
      }

      // Students
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('by-uuid', 'uuid', { unique: true });
        studentStore.createIndex('by-student-id', 'student_id', { unique: true });
        studentStore.createIndex('by-class-id', 'class_id');
      }

      // Teachers
      if (!db.objectStoreNames.contains('teachers')) {
        const teacherStore = db.createObjectStore('teachers', { keyPath: 'id' });
        teacherStore.createIndex('by-uuid', 'uuid', { unique: true });
        teacherStore.createIndex('by-employee-id', 'employee_id', { unique: true });
      }

      // Classes
      if (!db.objectStoreNames.contains('classes')) {
        const classStore = db.createObjectStore('classes', { keyPath: 'id' });
        classStore.createIndex('by-uuid', 'uuid', { unique: true });
        classStore.createIndex('by-division-id', 'division_id');
      }

      // Subjects
      if (!db.objectStoreNames.contains('subjects')) {
        const subjectStore = db.createObjectStore('subjects', { keyPath: 'id' });
        subjectStore.createIndex('by-uuid', 'uuid', { unique: true });
        subjectStore.createIndex('by-code', 'code', { unique: true });
      }

      // Attendance
      if (!db.objectStoreNames.contains('attendance')) {
        const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id' });
        attendanceStore.createIndex('by-uuid', 'uuid', { unique: true });
        attendanceStore.createIndex('by-student-id', 'student_id');
        attendanceStore.createIndex('by-date', 'date');
      }

      // Grades
      if (!db.objectStoreNames.contains('grades')) {
        const gradeStore = db.createObjectStore('grades', { keyPath: 'id' });
        gradeStore.createIndex('by-uuid', 'uuid', { unique: true });
        gradeStore.createIndex('by-student-id', 'student_id');
        gradeStore.createIndex('by-academic-year', 'academic_year');
      }

      // Assignments
      if (!db.objectStoreNames.contains('assignments')) {
        const assignmentStore = db.createObjectStore('assignments', { keyPath: 'id' });
        assignmentStore.createIndex('by-uuid', 'uuid', { unique: true });
        assignmentStore.createIndex('by-class-id', 'class_id');
      }

      // Student Comments
      if (!db.objectStoreNames.contains('student_comments')) {
        const commentStore = db.createObjectStore('student_comments', { keyPath: 'id' });
        commentStore.createIndex('by-uuid', 'uuid', { unique: true });
        commentStore.createIndex('by-student-id', 'student_id');
      }

      // Fees
      if (!db.objectStoreNames.contains('fees')) {
        const feeStore = db.createObjectStore('fees', { keyPath: 'id' });
        feeStore.createIndex('by-uuid', 'uuid', { unique: true });
        feeStore.createIndex('by-academic-year', 'academic_year');
      }

      // Payments
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
        paymentStore.createIndex('by-uuid', 'uuid', { unique: true });
        paymentStore.createIndex('by-student-id', 'student_id');
      }

      // Receipts
      if (!db.objectStoreNames.contains('receipts')) {
        const receiptStore = db.createObjectStore('receipts', { keyPath: 'id' });
        receiptStore.createIndex('by-uuid', 'uuid', { unique: true });
        receiptStore.createIndex('by-payment-id', 'payment_id');
      }

      // Sync Queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('by-status', 'status');
      }
    },
  });

  return db;
};

export const getDB = async (): Promise<IDBPDatabase<SICSSDB>> => {
  if (!db) {
    return await initDB();
  }
  return db;
};

export const closeDB = async (): Promise<void> => {
  if (db) {
    db.close();
    db = null;
  }
};
