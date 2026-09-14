<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageContent extends Model
{
    protected $fillable = [
        'page_key',
        'section_key',
        'content',
        'content_type',
        'text_color',
        'background_color',
    ];

    protected $casts = [
        'content' => 'string',
    ];

    /**
     * Get content for a specific page and section
     */
    public static function getContent(string $pageKey, string $sectionKey, $default = ''): string
    {
        $content = self::where('page_key', $pageKey)
            ->where('section_key', $sectionKey)
            ->first();

        return $content ? $content->content : $default;
    }

    /**
     * Set content for a specific page and section
     */
    public static function setContent(string $pageKey, string $sectionKey, string $content, string $contentType = 'text'): self
    {
        return self::updateOrCreate(
            ['page_key' => $pageKey, 'section_key' => $sectionKey],
            ['content' => $content, 'content_type' => $contentType]
        );
    }
}
