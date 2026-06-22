<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService
{
    private const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    private const MAX_WIDTH = 1200;

    private const THUMB_WIDTH = 400;

    /**
     * @return array{path: string, thumbnail: string}
     */
    public function upload(UploadedFile $file, ?string $directory = null): array
    {
        $this->validateMime($file);

        $directory ??= 'products';
        $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $storagePath = $directory . '/' . $filename;

        $image = $this->createImage($file);
        $width = imagesx($image);

        if ($width > self::MAX_WIDTH) {
            $image = $this->resize($image, self::MAX_WIDTH);
        }

        $this->saveImage($image, $storagePath, $file->getMimeType());
        imagedestroy($image);

        $thumbPath = $directory . '/thumb_' . $filename;
        $thumb = $this->createImage($file);
        $thumb = $this->resize($thumb, self::THUMB_WIDTH);
        $this->saveImage($thumb, $thumbPath, $file->getMimeType());
        imagedestroy($thumb);

        return [
            'path' => $storagePath,
            'thumbnail' => $thumbPath,
        ];
    }

    public function delete(string $path): void
    {
        Storage::disk('public')->delete($path);
        $thumbPath = dirname($path) . '/thumb_' . basename($path);
        Storage::disk('public')->delete($thumbPath);
    }

    private function validateMime(UploadedFile $file): void
    {
        $mime = $file->getMimeType();
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            throw new \InvalidArgumentException('Invalid image type. Allowed: jpg, png, webp.');
        }
    }

    /**
     * @return \GdImage
     */
    private function createImage(UploadedFile $file): mixed
    {
        $mime = $file->getMimeType();

        return match ($mime) {
            'image/jpeg' => imagecreatefromjpeg($file->getRealPath()),
            'image/png' => imagecreatefrompng($file->getRealPath()),
            'image/webp' => imagecreatefromwebp($file->getRealPath()),
            default => throw new \InvalidArgumentException('Unsupported image type.'),
        };
    }

    /**
     * @param \GdImage $image
     * @return \GdImage
     */
    private function resize(mixed $image, int $maxWidth): mixed
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $ratio = $maxWidth / $width;
        $newWidth = $maxWidth;
        $newHeight = (int) round($height * $ratio);

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        return $resized;
    }

    /**
     * @param \GdImage $image
     */
    private function saveImage(mixed $image, string $path, string $mime): void
    {
        $fullPath = Storage::disk('public')->path($path);
        $dir = dirname($fullPath);

        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        match ($mime) {
            'image/jpeg' => imagejpeg($image, $fullPath, 85),
            'image/png' => imagepng($image, $fullPath, 8),
            'image/webp' => imagewebp($image, $fullPath, 85),
            default => throw new \InvalidArgumentException('Unsupported image type.'),
        };
    }
}
