<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::with(['uploadedBy', 'student', 'teacher']);

        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        if ($request->has('public')) {
            $query->public();
        }

        if ($request->has('student_id')) {
            $query->byStudent($request->student_id);
        }

        if ($request->has('teacher_id')) {
            $query->byTeacher($request->teacher_id);
        }

        $documents = $query->orderBy('created_at', 'desc')->get();
        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10240',
            'category' => 'nullable|string|max:100',
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'is_public' => 'boolean',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('documents', $fileName, 'public');

            $document = Document::create([
                'title' => $request->title,
                'description' => $request->description,
                'file_path' => $filePath,
                'file_name' => $fileName,
                'file_type' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize(),
                'category' => $request->category,
                'uploaded_by' => auth()->id(),
                'student_id' => $request->student_id,
                'teacher_id' => $request->teacher_id,
                'is_public' => $request->is_public ?? false,
            ]);

            return response()->json($document, 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function show($id)
    {
        $document = Document::with(['uploadedBy', 'student', 'teacher'])->findOrFail($id);
        return response()->json($document);
    }

    public function download($id)
    {
        $document = Document::findOrFail($id);
        $filePath = storage_path('app/public/' . $document->file_path);
        
        if (!file_exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return response()->download($filePath, $document->file_name);
    }

    public function update(Request $request, $id)
    {
        $document = Document::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'is_public' => 'boolean',
        ]);

        $document->update([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'is_public' => $request->is_public ?? false,
        ]);

        return response()->json($document);
    }

    public function destroy($id)
    {
        $document = Document::findOrFail($id);
        
        $filePath = storage_path('app/public/' . $document->file_path);
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $document->delete();
        return response()->json(['message' => 'Document deleted successfully']);
    }
}
