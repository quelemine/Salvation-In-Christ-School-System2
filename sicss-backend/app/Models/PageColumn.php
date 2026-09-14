<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageColumn extends Model
{
    protected $fillable = [
        'page_key',
        'column_key',
        'label',
        'visible',
        'order',
        'width',
        'sortable',
        'filterable',
        'custom_options',
    ];

    protected $casts = [
        'visible' => 'boolean',
        'sortable' => 'boolean',
        'filterable' => 'boolean',
        'custom_options' => 'array',
    ];

    /**
     * Get columns for a specific page
     */
    public static function getColumns(string $pageKey): array
    {
        return self::where('page_key', $pageKey)
            ->orderBy('order')
            ->get()
            ->toArray();
    }

    /**
     * Set columns for a specific page
     */
    public static function setColumns(string $pageKey, array $columns): void
    {
        foreach ($columns as $column) {
            self::updateOrCreate(
                ['page_key' => $pageKey, 'column_key' => $column['column_key']],
                [
                    'label' => $column['label'],
                    'visible' => $column['visible'] ?? true,
                    'order' => $column['order'] ?? 0,
                    'width' => $column['width'] ?? null,
                    'sortable' => $column['sortable'] ?? true,
                    'filterable' => $column['filterable'] ?? false,
                    'custom_options' => $column['custom_options'] ?? null,
                ]
            );
        }
    }

    /**
     * Get default columns for a page
     */
    public static function getDefaultColumns(string $pageKey): array
    {
        $defaults = [
            'students' => [
                ['column_key' => 'id', 'label' => 'ID', 'visible' => true, 'order' => 1, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'name', 'label' => 'Name', 'visible' => true, 'order' => 2, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'email', 'label' => 'Email', 'visible' => true, 'order' => 3, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'class', 'label' => 'Class', 'visible' => true, 'order' => 4, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'division', 'label' => 'Division', 'visible' => true, 'order' => 5, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'status', 'label' => 'Status', 'visible' => true, 'order' => 6, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'actions', 'label' => 'Actions', 'visible' => true, 'order' => 7, 'sortable' => false, 'filterable' => false],
            ],
            'teachers' => [
                ['column_key' => 'id', 'label' => 'ID', 'visible' => true, 'order' => 1, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'name', 'label' => 'Name', 'visible' => true, 'order' => 2, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'email', 'label' => 'Email', 'visible' => true, 'order' => 3, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'subject', 'label' => 'Subject', 'visible' => true, 'order' => 4, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'phone', 'label' => 'Phone', 'visible' => true, 'order' => 5, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'actions', 'label' => 'Actions', 'visible' => true, 'order' => 6, 'sortable' => false, 'filterable' => false],
            ],
            'classes' => [
                ['column_key' => 'id', 'label' => 'ID', 'visible' => true, 'order' => 1, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'name', 'label' => 'Class Name', 'visible' => true, 'order' => 2, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'division', 'label' => 'Division', 'visible' => true, 'order' => 3, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'students_count', 'label' => 'Students', 'visible' => true, 'order' => 4, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'actions', 'label' => 'Actions', 'visible' => true, 'order' => 5, 'sortable' => false, 'filterable' => false],
            ],
            'subjects' => [
                ['column_key' => 'id', 'label' => 'ID', 'visible' => true, 'order' => 1, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'name', 'label' => 'Subject Name', 'visible' => true, 'order' => 2, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'code', 'label' => 'Code', 'visible' => true, 'order' => 3, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'credits', 'label' => 'Credits', 'visible' => true, 'order' => 4, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'actions', 'label' => 'Actions', 'visible' => true, 'order' => 5, 'sortable' => false, 'filterable' => false],
            ],
            'divisions' => [
                ['column_key' => 'id', 'label' => 'ID', 'visible' => true, 'order' => 1, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'name', 'label' => 'Division Name', 'visible' => true, 'order' => 2, 'sortable' => true, 'filterable' => true],
                ['column_key' => 'description', 'label' => 'Description', 'visible' => true, 'order' => 3, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'classes_count', 'label' => 'Classes', 'visible' => true, 'order' => 4, 'sortable' => true, 'filterable' => false],
                ['column_key' => 'actions', 'label' => 'Actions', 'visible' => true, 'order' => 5, 'sortable' => false, 'filterable' => false],
            ],
        ];

        return $defaults[$pageKey] ?? [];
    }
}
