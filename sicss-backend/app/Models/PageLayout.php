<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageLayout extends Model
{
    protected $fillable = [
        'page_key',
        'sections',
        'layout_type',
        'primary_button_color',
        'secondary_button_color',
    ];

    protected $casts = [
        'sections' => 'array',
    ];

    /**
     * Get layout for a specific page
     */
    public static function getLayout(string $pageKey): ?array
    {
        $layout = self::where('page_key', $pageKey)->first();
        return $layout ? $layout->toArray() : null;
    }

    /**
     * Set layout for a specific page
     */
    public static function setLayout(string $pageKey, array $sections, string $layoutType = 'default'): self
    {
        return self::updateOrCreate(
            ['page_key' => $pageKey],
            ['sections' => $sections, 'layout_type' => $layoutType]
        );
    }

    /**
     * Get default sections for a page
     */
    public static function getDefaultSections(string $pageKey): array
    {
        $defaults = [
            'students' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'teachers' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'classes' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'subjects' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'divisions' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'grades' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'attendance' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'assignments' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'fees' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'payments' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'invoices' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'announcements' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'helpdesk' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'users' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'activity-logs' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'report-cards' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
            'receipts' => [
                ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
                ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
                ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
                ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
            ],
        ];

        return $defaults[$pageKey] ?? [
            ['id' => 'header', 'type' => 'header', 'visible' => true, 'order' => 1],
            ['id' => 'search', 'type' => 'search', 'visible' => true, 'order' => 2],
            ['id' => 'table', 'type' => 'table', 'visible' => true, 'order' => 3],
            ['id' => 'pagination', 'type' => 'pagination', 'visible' => true, 'order' => 4],
        ];
    }
}
