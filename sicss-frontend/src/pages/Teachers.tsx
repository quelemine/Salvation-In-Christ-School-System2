/**
 * Teachers — Admin management page
 *
 * Displays all teachers in a clean list table showing:
 *   - Teacher info (photo, name, employee ID)
 *   - System Role  (the user account's role — e.g. Teacher, Principal)
 *   - Subject Responsibilities (subjects + classes from teacher_subject_class)
 *   - Class Sponsor (from classes.sponsor_teacher_id)
 *   - Status + Manage action
 *
 * The "Manage" button opens a right-side drawer with three independent sections:
 *   1. System Role — change via PUT /teachers/{id}/system-role
 *   2. Subject Teacher Assignments — add/remove via POST/DELETE
 *   3. Class Sponsor — add/remove via POST/DELETE
 *
 * These three sections are COMPLETELY INDEPENDENT. Changing one never
 * automatically affects the others.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { classService } from '../services/classService';
import { subjectService, type Subject } from '../services/subjectService';
import { divisionService } from '../services/divisionService';
import api from '../services/api';
import {
  teacherAssignmentService,
  type TeacherSummary,
  type TeacherAssignments,
  type SubjectAssignment,
} from '../services/teacherService';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  LoadingState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui';

// ─── Local types ──────────────────────────────────────────────────────────────

interface Role {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

interface ClassOption {
  id: number;
  name: string;
  section?: string | null;
  division?: { name: string };
  division_id?: number;
}

interface DivisionOption {
  id: number;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classLabel(c: ClassOption) {
  return c.section ? `${c.name} — ${c.section}` : c.name;
}

function roleVariant(slug: string | null): 'default' | 'info' | 'success' | 'warning' {
  if (!slug) return 'default';
  if (slug === 'admin') return 'danger' as any;
  if (slug === 'teacher') return 'info';
  if (slug === 'vice-principal-instruction' || slug === 'principal') return 'warning';
  if (slug === 'proprietor' || slug === 'proprietress') return 'success';
  return 'default';
}

// Authoritative roles that can be assigned via system-role change.
// Class Sponsor and Subject Teacher are legacy/unused as system roles per RoleSeeder.
const ASSIGNABLE_ROLE_SLUGS = [
  'teacher',
  'vice-principal-instruction',
  'principal',
  'proprietor',
  'proprietress',
  'finance-staff',
  'admin',
];

// ─── Confirmation dialog ──────────────────────────────────────────────────────

interface ConfirmProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-base font-bold text-slate-900">{title}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline alert ──────────────────────────────────────────────────────────────

function Alert({ ok, text, onDismiss }: { ok: boolean; text: string; onDismiss?: () => void }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
      ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
         : 'border-rose-200 bg-rose-50 text-rose-700'
    }`}>
      <span className="shrink-0 font-bold">{ok ? '✓' : '⚠'}</span>
      <span className="flex-1">{text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 text-slate-400 hover:text-slate-600 text-base leading-none">×</button>
      )}
    </div>
  );
}

// ─── Management drawer ────────────────────────────────────────────────────────

interface DrawerProps {
  summary: TeacherSummary;
  allClasses: ClassOption[];
  allDivisions: DivisionOption[];
  allSubjects: Subject[];
  allRoles: Role[];
  onClose: () => void;
  onRefreshList: () => void;
}

function TeacherManageDrawer({
  summary,
  allClasses,
  allDivisions,
  allSubjects,
  allRoles,
  onClose,
  onRefreshList,
}: DrawerProps) {
  const [assignments, setAssignments] = useState<TeacherAssignments | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState('');

  // Role-change form
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleConfirm, setRoleConfirm] = useState(false);
  const [roleMsg, setRoleMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Subject assignment form
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [selDivision, setSelDivision] = useState('');
  const [selClass, setSelClass] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [subjectMsg, setSubjectMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removingSubjectId, setRemovingSubjectId] = useState<number | null>(null);
  const [subjectRemoveConfirm, setSubjectRemoveConfirm] = useState<SubjectAssignment | null>(null);

  // Class sponsor form
  const [sponsorFormOpen, setSponsorFormOpen] = useState(false);
  const [selSponsorDivision, setSelSponsorDivision] = useState('');
  const [selSponsorClass, setSelSponsorClass] = useState('');
  const [assigningSponsor, setAssigningSponsor] = useState(false);
  const [sponsorMsg, setSponsorMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [removingSponsor, setRemovingSponsor] = useState(false);
  const [sponsorRemoveConfirm, setSponsorRemoveConfirm] = useState(false);

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setAssignmentsError('');
    try {
      const data = await teacherAssignmentService.getAssignments(summary.id);
      setAssignments(data);
    } catch (err: any) {
      setAssignmentsError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  }, [summary.id]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  // ── Division-filtered class lists ──
  const subjectClassOptions = selDivision
    ? allClasses.filter((c) => String(c.division_id) === selDivision)
    : allClasses;
  const sponsorClassOptions = selSponsorDivision
    ? allClasses.filter((c) => String(c.division_id) === selSponsorDivision)
    : allClasses;

  // ── Role change ──────────────────────────────────────────────────────────────
  const assignableRoles = allRoles.filter((r) => ASSIGNABLE_ROLE_SLUGS.includes(r.slug) && r.is_active);
  const currentRoleId = assignableRoles.find((r) => r.slug === assignments?.teacher.system_role_slug)?.id;

  const handleRoleChange = async () => {
    if (!selectedRoleId) return;
    setRoleMsg(null);
    try {
      const res = await teacherAssignmentService.changeSystemRole(summary.id, Number(selectedRoleId));
      setRoleMsg({ ok: true, text: `System role changed to ${res.new_role}.` });
      setRoleChangeOpen(false);
      setSelectedRoleId('');
      await loadAssignments();
      onRefreshList();
    } catch (err: any) {
      setRoleMsg({ ok: false, text: err.response?.data?.message || 'Failed to change role.' });
    } finally {
      setRoleConfirm(false);
    }
  };

  // ── Subject assignment ────────────────────────────────────────────────────────
  const handleAssignSubject = async () => {
    if (!selClass || !selSubject) {
      setSubjectMsg({ ok: false, text: 'Please select both a class and a subject.' });
      return;
    }
    setAssigningSubject(true); setSubjectMsg(null);
    try {
      const res = await teacherAssignmentService.assignSubject(
        summary.id, Number(selSubject), Number(selClass),
      );
      setSubjectMsg({ ok: true, text: res.message });
      setSubjectFormOpen(false);
      setSelDivision(''); setSelClass(''); setSelSubject('');
      await loadAssignments();
      onRefreshList();
    } catch (err: any) {
      setSubjectMsg({ ok: false, text: err.response?.data?.message || 'Failed to assign subject.' });
    } finally {
      setAssigningSubject(false); }
  };

  const handleRemoveSubject = async (assignment: SubjectAssignment) => {
    setRemovingSubjectId(assignment.id); setSubjectMsg(null);
    try {
      const res = await teacherAssignmentService.removeSubjectAssignment(summary.id, assignment.id);
      setSubjectMsg({ ok: true, text: res.message });
      await loadAssignments();
      onRefreshList();
    } catch (err: any) {
      setSubjectMsg({ ok: false, text: err.response?.data?.message || 'Failed to remove assignment.' });
    } finally {
      setRemovingSubjectId(null); setSubjectRemoveConfirm(null);
    }
  };

  // ── Class sponsor ─────────────────────────────────────────────────────────────
  const handleAssignSponsor = async () => {
    if (!selSponsorClass) {
      setSponsorMsg({ ok: false, text: 'Please select a class.' });
      return;
    }
    setAssigningSponsor(true); setSponsorMsg(null);
    try {
      const res = await teacherAssignmentService.assignClassSponsor(summary.id, Number(selSponsorClass));
      setSponsorMsg({ ok: true, text: res.message });
      setSponsorFormOpen(false);
      setSelSponsorDivision(''); setSelSponsorClass('');
      await loadAssignments();
      onRefreshList();
    } catch (err: any) {
      setSponsorMsg({ ok: false, text: err.response?.data?.message || 'Failed to assign class sponsor.' });
    } finally {
      setAssigningSponsor(false);
    }
  };

  const handleRemoveSponsor = async () => {
    if (!assignments?.class_sponsorship) return;
    setRemovingSponsor(true); setSponsorMsg(null);
    try {
      const res = await teacherAssignmentService.removeClassSponsor(
        summary.id, assignments.class_sponsorship.class_id,
      );
      setSponsorMsg({ ok: true, text: res.message });
      await loadAssignments();
      onRefreshList();
    } catch (err: any) {
      setSponsorMsg({ ok: false, text: err.response?.data?.message || 'Failed to remove sponsorship.' });
    } finally {
      setRemovingSponsor(false); setSponsorRemoveConfirm(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label={`Manage ${summary.name}`}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[640px] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Manage teacher</p>
            <h2 className="mt-0.5 text-xl font-bold text-slate-900">{summary.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500 font-mono">{summary.employee_id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {loadingAssignments && <LoadingState message="Loading assignments…" />}
          {assignmentsError && <Alert ok={false} text={assignmentsError} />}

          {assignments && (
            <>
              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 1 — System Role                                       */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">System Role</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The user account's system-level role. Independent of teaching responsibilities.
                    </p>
                  </div>
                  {!roleChangeOpen && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRoleChangeOpen(true);
                        setSelectedRoleId(String(currentRoleId ?? ''));
                        setRoleMsg(null);
                      }}
                    >
                      Change role
                    </Button>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
                  <span className="text-xl">🏷</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {assignments.teacher.system_role ?? <span className="text-slate-400 font-normal">No role assigned</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {assignments.teacher.system_role_slug ?? '—'}
                    </p>
                  </div>
                </div>

                {roleMsg && (
                  <div className="mt-2">
                    <Alert ok={roleMsg.ok} text={roleMsg.text} onDismiss={() => setRoleMsg(null)} />
                  </div>
                )}

                {roleChangeOpen && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-800">Select new system role</p>
                    <select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select role —</option>
                      {assignableRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                          {r.id === currentRoleId ? ' (current)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setRoleChangeOpen(false); setSelectedRoleId(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selectedRoleId || selectedRoleId === String(currentRoleId)}
                        onClick={() => setRoleConfirm(true)}
                      >
                        Apply change
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 2 — Subject Teacher Assignments                       */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Subject Teacher Assignments</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Subjects this teacher is responsible for in specific classes. Stored in{' '}
                      <code className="font-mono text-[10px] bg-slate-100 px-1 rounded">teacher_subject_class</code>.
                    </p>
                  </div>
                  {!subjectFormOpen && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setSubjectFormOpen(true); setSubjectMsg(null); }}
                    >
                      + Assign subject
                    </Button>
                  )}
                </div>

                {subjectMsg && (
                  <div className="mb-3">
                    <Alert ok={subjectMsg.ok} text={subjectMsg.text} onDismiss={() => setSubjectMsg(null)} />
                  </div>
                )}

                {/* Add-subject form */}
                {subjectFormOpen && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-800">Assign a subject to a class</p>

                    {/* Division filter */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Division (filter)</label>
                      <select
                        value={selDivision}
                        onChange={(e) => { setSelDivision(e.target.value); setSelClass(''); }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All divisions</option>
                        {allDivisions.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Class */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Class / Grade <span className="text-rose-500">*</span></label>
                      <select
                        value={selClass}
                        onChange={(e) => setSelClass(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select class —</option>
                        {subjectClassOptions.map((c) => (
                          <option key={c.id} value={c.id}>{classLabel(c)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Subject <span className="text-rose-500">*</span></label>
                      <select
                        value={selSubject}
                        onChange={(e) => setSelSubject(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select subject —</option>
                        {allSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code ? `${s.code} — ` : ''}{s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setSubjectFormOpen(false); setSelDivision(''); setSelClass(''); setSelSubject(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selClass || !selSubject || assigningSubject}
                        onClick={handleAssignSubject}
                      >
                        {assigningSubject ? 'Assigning…' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Assignments table */}
                {assignments.subject_assignments.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                    <p className="text-2xl mb-1">📚</p>
                    <p className="text-sm font-semibold text-slate-500">No Subject Teacher assignments</p>
                    <p className="text-xs text-slate-400 mt-1">Use the button above to assign a subject.</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Class / Grade</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {assignments.subject_assignments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">{a.subject_name ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{a.class_name ?? '—'}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSubjectRemoveConfirm(a)}
                                disabled={removingSubjectId === a.id}
                                className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40"
                              >
                                {removingSubjectId === a.id ? 'Removing…' : 'Remove'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              {/* ────────────────────────────────────────────────────────────── */}
              {/* SECTION 3 — Class Sponsor                                     */}
              {/* ────────────────────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Class Sponsor</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The class this teacher sponsors. Stored in{' '}
                      <code className="font-mono text-[10px] bg-slate-100 px-1 rounded">classes.sponsor_teacher_id</code>.
                      Only one sponsor per class.
                    </p>
                  </div>
                  {!sponsorFormOpen && !assignments.class_sponsorship && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setSponsorFormOpen(true); setSponsorMsg(null); }}
                    >
                      + Assign sponsor
                    </Button>
                  )}
                </div>

                {sponsorMsg && (
                  <div className="mb-3">
                    <Alert ok={sponsorMsg.ok} text={sponsorMsg.text} onDismiss={() => setSponsorMsg(null)} />
                  </div>
                )}

                {/* Add-sponsor form */}
                {sponsorFormOpen && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-800">Assign class sponsor responsibility</p>

                    {/* Division filter */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Division (filter)</label>
                      <select
                        value={selSponsorDivision}
                        onChange={(e) => { setSelSponsorDivision(e.target.value); setSelSponsorClass(''); }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All divisions</option>
                        {allDivisions.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Class */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Class / Grade <span className="text-rose-500">*</span></label>
                      <select
                        value={selSponsorClass}
                        onChange={(e) => setSelSponsorClass(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Select class —</option>
                        {sponsorClassOptions.map((c) => (
                          <option key={c.id} value={c.id}>{classLabel(c)}</option>
                        ))}
                      </select>
                    </div>

                    <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      If the selected class already has a sponsor, the assignment will be rejected. Remove the current sponsor first.
                    </p>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => { setSponsorFormOpen(false); setSelSponsorDivision(''); setSelSponsorClass(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!selSponsorClass || assigningSponsor}
                        onClick={handleAssignSponsor}
                      >
                        {assigningSponsor ? 'Assigning…' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Current sponsorship */}
                {assignments.class_sponsorship ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Sponsored Class</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {assignments.class_sponsorship.class_name}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSponsorRemoveConfirm(true)}
                              disabled={removingSponsor}
                              className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40"
                            >
                              {removingSponsor ? 'Removing…' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : !sponsorFormOpen ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
                    <p className="text-2xl mb-1">🏫</p>
                    <p className="text-sm font-semibold text-slate-500">No Class Sponsor assignment</p>
                    <p className="text-xs text-slate-400 mt-1">Use the button above to assign a sponsored class.</p>
                  </div>
                ) : null}
              </section>

              {/* Bottom padding */}
              <div className="h-6" />
            </>
          )}
        </div>
      </div>

      {/* ── Confirmation dialogs ── */}

      {roleConfirm && (
        <ConfirmDialog
          title="Change System Role"
          message={`Current: ${assignments?.teacher.system_role ?? '—'}\nNew: ${assignableRoles.find((r) => r.id === Number(selectedRoleId))?.name ?? '—'}\n\nAre you sure you want to change this user's system role? This does not affect their teaching responsibilities.`}
          confirmLabel="Change role"
          onConfirm={handleRoleChange}
          onCancel={() => setRoleConfirm(false)}
        />
      )}

      {subjectRemoveConfirm && (
        <ConfirmDialog
          title="Remove Subject Assignment"
          message={`Remove ${subjectRemoveConfirm.subject_name ?? 'this subject'} — ${subjectRemoveConfirm.class_name ?? 'this class'} from this teacher's Subject Teacher assignments?\n\nThis will not affect their Class Sponsor responsibility or system role.`}
          confirmLabel="Remove"
          danger
          onConfirm={() => handleRemoveSubject(subjectRemoveConfirm)}
          onCancel={() => setSubjectRemoveConfirm(null)}
        />
      )}

      {sponsorRemoveConfirm && assignments?.class_sponsorship && (
        <ConfirmDialog
          title="Remove Class Sponsor"
          message={`Remove ${assignments.class_sponsorship.class_name} Class Sponsor responsibility from this teacher?\n\nThis will not affect their Subject Teacher assignments or system role.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleRemoveSponsor}
          onCancel={() => setSponsorRemoveConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function Teachers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role?.slug === 'admin';

  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [allDivisions, setAllDivisions] = useState<DivisionOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [managingTeacher, setManagingTeacher] = useState<TeacherSummary | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [teacherData, classData, subjectData, divisionData] = await Promise.all([
        teacherAssignmentService.getAllWithAssignments(),
        classService.getAll(),
        subjectService.getAll(),
        divisionService.getAll(),
      ]);

      setTeachers(Array.isArray(teacherData) ? teacherData : []);

      const classes = ((classData as any).data ?? classData) as ClassOption[];
      setAllClasses(Array.isArray(classes) ? classes : []);

      const subjects = ((subjectData as any).data ?? subjectData) as Subject[];
      setAllSubjects(Array.isArray(subjects) ? subjects : []);

      const divisions = ((divisionData as any).data ?? divisionData) as DivisionOption[];
      setAllDivisions(Array.isArray(divisions) ? divisions : []);

      // Fetch roles for the role-change picker
      try {
        const rolesRes = await api.get('/roles');
        const roles = rolesRes.data?.data ?? rolesRes.data ?? [];
        setAllRoles(Array.isArray(roles) ? roles : []);
      } catch {
        // Roles endpoint may 403 for some builds — continue without it
      }
    } catch (err: any) {
      setPageError(err.response?.data?.message || 'Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = teachers.filter((t) =>
    `${t.name} ${t.email} ${t.employee_id}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Staff management</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Teachers</h1>
          <p className="mt-1 text-sm text-slate-500">
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} in the system.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => navigate('/application')}
            className="self-start sm:self-auto"
          >
            + Add teacher
          </Button>
        )}
      </div>

      {pageError && <Alert ok={false} text={pageError} />}

      {/* ── Teacher list card ── */}
      <Card>
        <CardContent className="p-0">

          {/* Search bar */}
          <div className="border-b border-slate-100 px-6 py-4">
            <input
              type="search"
              placeholder="Search by name, email, or employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <LoadingState message="Loading teachers…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? 'No results' : 'No teachers yet'}
              description={search ? 'Try a different search.' : 'Add your first teacher to get started.'}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead className="hidden md:table-cell">Subject Responsibilities</TableHead>
                  <TableHead className="hidden md:table-cell">Class Sponsor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    {/* Teacher info */}
                    <TableCell className="min-w-[160px]">
                      <div>
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{t.employee_id}</p>
                        <p className="text-xs text-slate-400 mt-0.5 hidden sm:block truncate max-w-[200px]">{t.email}</p>
                      </div>
                    </TableCell>

                    {/* System role */}
                    <TableCell>
                      {t.system_role ? (
                        <Badge variant={roleVariant(t.system_role_slug) as any}>
                          {t.system_role}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No role</span>
                      )}
                    </TableCell>

                    {/* Subject responsibilities */}
                    <TableCell className="hidden md:table-cell">
                      {t.subject_count > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          {t.subject_count} subject{t.subject_count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Class sponsor */}
                    <TableCell className="hidden md:table-cell">
                      {t.sponsored_class ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {t.sponsored_class}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      {isAdmin ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setManagingTeacher(t)}
                        >
                          Manage
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">View only</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400 font-medium">
            {filtered.length} of {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* ── Management drawer ── */}
      {managingTeacher && (
        <TeacherManageDrawer
          summary={managingTeacher}
          allClasses={allClasses}
          allDivisions={allDivisions}
          allSubjects={allSubjects}
          allRoles={allRoles}
          onClose={() => setManagingTeacher(null)}
          onRefreshList={loadAll}
        />
      )}
    </div>
  );
}
