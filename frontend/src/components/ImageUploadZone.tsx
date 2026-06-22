import { useCallback, useRef, useState } from 'react';

interface ImageItem {
  id?: number;
  url?: string;
  thumbnail_url?: string;
  path?: string;
  is_primary: boolean;
  sort_order: number;
  file?: File;
  preview?: string;
}

interface ImageUploadZoneProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxFiles?: number;
}

export default function ImageUploadZone({ images, onChange, maxFiles = 10 }: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFiles = useCallback(
    (files: FileList) => {
      const remaining = maxFiles - images.length;
      if (remaining <= 0) return;

      const newImages: ImageItem[] = [];
      Array.from(files)
        .slice(0, remaining)
        .forEach((file) => {
          if (!file.type.startsWith('image/')) return;
          newImages.push({
            file,
            preview: URL.createObjectURL(file),
            is_primary: images.length === 0 && newImages.length === 0,
            sort_order: images.length + newImages.length,
          });
        });

      onChange([...images, ...newImages]);
    },
    [images, onChange, maxFiles],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    const hasPrimary = updated.some((img) => img.is_primary);
    if (!hasPrimary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  }

  function setPrimary(index: number) {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOverItem(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...images];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    setDraggedIndex(index);
    onChange(updated);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-secondary-300 bg-white hover:border-secondary-400'
        }`}
      >
        <svg className="mb-2 h-10 w-10 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-secondary-600">
          {dragOver ? 'Drop images here' : 'Drag & drop images or click to browse'}
        </p>
        <p className="mt-1 text-xs text-secondary-400">
          PNG, JPG, WebP up to 10MB. {images.length}/{maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-lg border bg-white transition-shadow ${
                draggedIndex === index ? 'opacity-50 shadow-md' : 'border-secondary-200'
              }`}
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={image.preview || image.thumbnail_url || image.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between px-2 py-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrimary(index);
                  }}
                  className={`text-xs font-medium ${
                    image.is_primary ? 'text-primary-600' : 'text-secondary-400 hover:text-secondary-600'
                  }`}
                >
                  {image.is_primary ? 'Primary' : 'Set as primary'}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="text-secondary-400 hover:text-danger-600"
                  aria-label="Remove image"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {image.is_primary && (
                <span className="absolute left-2 top-2 rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
                  Primary
                </span>
              )}

              {/* Drag handle */}
              <div className="absolute right-2 top-2 cursor-grab rounded bg-white/80 p-1 text-secondary-400 opacity-0 transition-opacity group-hover:opacity-100">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
