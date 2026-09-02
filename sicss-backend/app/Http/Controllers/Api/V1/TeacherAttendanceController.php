<?php
namespace App\Http\Controllers\Api\V1;
use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherAttendance;
use App\Models\TeacherAttendanceSetting;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherAttendanceController extends Controller
{
    public function settings() { return response()->json(TeacherAttendanceSetting::whereNull('user_id')->firstOrCreate(['user_id' => null])); }
    public function updateSettings(Request $request) {
        $data = $request->validate(['late_deduction_percent' => 'required|numeric|min:0|max:100', 'absent_deduction_percent' => 'required|numeric|min:0|max:100']);
        $setting = TeacherAttendanceSetting::whereNull('user_id')->firstOrCreate(['user_id' => null]);
        $setting->update([...$data, 'updated_by' => $request->user()->id]);
        return response()->json($setting->fresh());
    }
    public function index(Request $request) {
        return response()->json(TeacherAttendance::with('teacher:id,employee_id,first_name,last_name', 'user:id,first_name,last_name,email')
            ->when($request->date, fn ($q, $date) => $q->where('attendance_date', $date))
            ->when($request->attendance_type, fn ($q, $type) => $q->where('attendance_type', $type))
            ->orderByDesc('attendance_date')->orderBy('teacher_id')->get());
    }
    public function bulk(Request $request) {
        $data = $request->validate([
            'attendance_date' => 'required|date', 'attendance_type' => 'required|in:working_day,meeting',
            'attendances' => 'required|array|min:1', 'attendances.*.teacher_id' => 'nullable|exists:teachers,id', 'attendances.*.user_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|in:present,late,absent,excused', 'attendances.*.check_in_time' => 'nullable|date_format:H:i', 'attendances.*.remarks' => 'nullable|string',
        ]);
        $records = collect($data['attendances'])->map(function ($item) use ($data, $request) {
            $teacherId = $item['teacher_id'] ?? Teacher::where('user_id', $item['user_id'])->value('id');
            return TeacherAttendance::updateOrCreate(['user_id' => $item['user_id'], 'attendance_date' => $data['attendance_date'], 'attendance_type' => $data['attendance_type']], [...$item, 'teacher_id' => $teacherId, 'attendance_date' => $data['attendance_date'], 'attendance_type' => $data['attendance_type'], 'recorded_by' => $request->user()->id]);
        });
        $this->notifyAttendanceRecorded($records, $data, $request);
        return response()->json($records->load('teacher:id,employee_id,first_name,last_name', 'user:id,first_name,last_name,email'));
    }

    public function staff()
    {
        return response()->json(User::with('role:id,name,slug')->where('is_active', true)->whereHas('role', fn ($query) => $query->whereNotIn('slug', ['student', 'parent']))->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email', 'role_id']));
    }

    public function individualSettings(Request $request, User $user)
    {
        $data = $request->validate(['late_deduction_percent' => 'required|numeric|min:0|max:100', 'absent_deduction_percent' => 'required|numeric|min:0|max:100']);
        $setting = TeacherAttendanceSetting::updateOrCreate(['user_id' => $user->id], [...$data, 'updated_by' => $request->user()->id]);
        return response()->json($setting);
    }

    private function notifyAttendanceRecorded($records, array $data, Request $request): void
    {
        $type = $data['attendance_type'] === 'meeting' ? 'staff meeting' : 'working day';
        $leaders = User::whereHas('role', fn ($query) => $query->whereIn('slug', ['finance', 'finance-staff', 'principal', 'vice-principal-instruction', 'proprietor', 'proprietress']))->pluck('id');
        if ($leaders->isNotEmpty()) {
            Announcement::create(['created_by' => $request->user()->id, 'title' => 'Teacher attendance recorded', 'body' => "Teacher attendance for {$type} on {$data['attendance_date']} has been recorded. Review the staff attendance register for details.", 'priority' => 'important', 'category' => 'academic', 'audience' => $leaders->implode(','), 'publish_at' => now(), 'expires_at' => now()->addDays(7)]);
        }
        foreach ($records as $record) {
            $userId = Teacher::whereKey($record->teacher_id)->value('user_id');
            if (!$userId) continue;
            Announcement::create(['created_by' => $request->user()->id, 'title' => 'Your attendance was recorded', 'body' => "Your {$type} attendance for {$data['attendance_date']} was recorded as {$record->status}.", 'priority' => $record->status === 'absent' ? 'important' : 'normal', 'category' => 'academic', 'audience' => (string) $userId, 'publish_at' => now(), 'expires_at' => now()->addDays(7)]);
        }
    }
    public function mine(Request $request) {
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        if (!$teacher) return response()->json(['today' => null, 'month' => ['present' => 0, 'late' => 0, 'absent' => 0, 'excused' => 0]]);
        $month = now()->format('Y-m');
        $records = TeacherAttendance::where('teacher_id', $teacher->id)->where('attendance_date', 'like', "{$month}%");
        return response()->json(['today' => TeacherAttendance::where('teacher_id', $teacher->id)->whereDate('attendance_date', now())->orderByDesc('id')->first(), 'month' => ['present' => (clone $records)->where('status', 'present')->count(), 'late' => (clone $records)->where('status', 'late')->count(), 'absent' => (clone $records)->where('status', 'absent')->count(), 'excused' => (clone $records)->where('status', 'excused')->count()]]);
    }
}
