<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\FeeStructureItem;
use App\Models\Student;
use Illuminate\Http\Request;

class FeeStructureController extends Controller
{
    // ── List fee structures ────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = FeeStructure::with(['class:id,name', 'items'])
            ->when($request->academic_year, fn($q, $y) => $q->where('academic_year', $y))
            ->when($request->class_id,      fn($q, $c) => $q->where('class_id', $c))
            ->latest();

        return response()->json($query->get()->map(function ($s) {
            $s->total_amount = $s->totalAmount();
            return $s;
        }));
    }

    // ── Create fee structure with items ────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'academic_year' => 'required|string|max:20',
            'class_id'      => 'nullable|exists:classes,id',
            'applies_to'    => 'in:all,class',
            'description'   => 'nullable|string',
            'is_active'     => 'boolean',
            'items'         => 'required|array|min:1',
            'items.*.label'        => 'required|string|max:255',
            'items.*.amount'       => 'required|numeric|min:0',
            'items.*.currency'     => 'sometimes|in:USD,LRD',
            'items.*.category'     => 'in:tuition,registration,uniform,exam,activity,library,other',
            'items.*.is_mandatory' => 'boolean',
            'items.*.due_date'     => 'nullable|date',
        ]);

        $structure = FeeStructure::create([
            'name'          => $data['name'],
            'academic_year' => $data['academic_year'],
            'class_id'      => $data['class_id'] ?? null,
            'applies_to'    => $data['applies_to'] ?? 'all',
            'description'   => $data['description'] ?? null,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        foreach ($data['items'] as $item) {
            $structure->items()->create([
                'label'        => $item['label'],
                'amount'       => $item['amount'],
                'currency'     => $item['currency']     ?? 'LRD',
                'category'     => $item['category']     ?? 'tuition',
                'is_mandatory' => $item['is_mandatory'] ?? true,
                'due_date'     => $item['due_date']     ?? null,
            ]);
        }

        $structure->load('class:id,name', 'items');
        $structure->total_amount = $structure->totalAmount();

        return response()->json($structure, 201);
    }

    // ── Show one structure ──────────────────────────────────────────────────
    public function show(FeeStructure $feeStructure)
    {
        $feeStructure->load('class:id,name', 'items');
        $feeStructure->total_amount = $feeStructure->totalAmount();
        return response()->json($feeStructure);
    }

    // ── Update structure + items ────────────────────────────────────────────
    public function update(Request $request, FeeStructure $feeStructure)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'academic_year' => 'sometimes|string|max:20',
            'class_id'      => 'nullable|exists:classes,id',
            'applies_to'    => 'in:all,class',
            'description'   => 'nullable|string',
            'is_active'     => 'boolean',
            'items'         => 'sometimes|array|min:1',
            'items.*.label'        => 'required_with:items|string|max:255',
            'items.*.amount'       => 'required_with:items|numeric|min:0',
            'items.*.currency'     => 'sometimes|in:USD,LRD',
            'items.*.category'     => 'in:tuition,registration,uniform,exam,activity,library,other',
            'items.*.is_mandatory' => 'boolean',
            'items.*.due_date'     => 'nullable|date',
        ]);

        $feeStructure->update(array_except($data, ['items']));

        if (isset($data['items'])) {
            $feeStructure->items()->delete();
            foreach ($data['items'] as $item) {
                $feeStructure->items()->create([
                    'label'        => $item['label'],
                    'amount'       => $item['amount'],
                    'currency'     => $item['currency']     ?? 'LRD',
                    'category'     => $item['category']     ?? 'tuition',
                    'is_mandatory' => $item['is_mandatory'] ?? true,
                    'due_date'     => $item['due_date']     ?? null,
                ]);
            }
        }

        $feeStructure->load('class:id,name', 'items');
        $feeStructure->total_amount = $feeStructure->totalAmount();
        return response()->json($feeStructure);
    }

    // ── Delete ──────────────────────────────────────────────────────────────
    public function destroy(FeeStructure $feeStructure)
    {
        $feeStructure->delete();
        return response()->json(['message' => 'Fee structure deleted.']);
    }

    // ── Admin: set student fee clearance ────────────────────────────────────
    public function clearStudent(Request $request, Student $student)
    {
        $data = $request->validate([
            'fees_cleared'            => 'required|boolean',
            'clearance_academic_year' => 'required|string|max:20',
        ]);

        $student->update([
            'fees_cleared'            => $data['fees_cleared'],
            'clearance_academic_year' => $data['clearance_academic_year'],
            'cleared_at'              => $data['fees_cleared'] ? now() : null,
            'cleared_by'              => $data['fees_cleared'] ? $request->user()->id : null,
        ]);

        return response()->json([
            'message'   => $data['fees_cleared'] ? 'Student cleared for fee obligations.' : 'Clearance revoked.',
            'student'   => $student->fresh(['class']),
        ]);
    }

    // ── Check clearance (used by frontend before allowing report card print) ─
    public function checkClearance(Request $request, Student $student)
    {
        $year = $request->query('academic_year', date('Y'));

        $cleared = $student->fees_cleared
            && $student->clearance_academic_year === (string) $year;

        return response()->json([
            'student_id'   => $student->id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'cleared'      => $cleared,
            'academic_year'=> $year,
            'cleared_at'   => $student->cleared_at,
        ]);
    }

    // ── Bulk clearance list for admin ──────────────────────────────────────
    public function studentClearances(Request $request)
    {
        $year = $request->query('academic_year', date('Y'));

        $students = Student::with('class:id,name')
            ->select(['id', 'student_id', 'first_name', 'last_name', 'class_id',
                      'fees_cleared', 'clearance_academic_year', 'cleared_at', 'status'])
            ->when($request->class_id, fn($q, $c) => $q->where('class_id', $c))
            ->orderBy('first_name')
            ->get()
            ->map(function ($s) use ($year) {
                $s->is_cleared = $s->fees_cleared && $s->clearance_academic_year === (string)$year;
                return $s;
            });

        return response()->json($students);
    }
}
