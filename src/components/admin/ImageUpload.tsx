'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2, ZoomIn, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
// Minimum dimensions
const MIN_DIMENSIONS = { width: 200, height: 200 };

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  aspectRatio?: number; // width / height
}

export default function ImageUpload({ 
  value, 
  onChange, 
  onError,
  label = 'Image',
  required = false,
  className = '',
  aspectRatio = 16/9
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{width: number; height: number} | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Validate image dimensions
  const validateImage = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isValid = img.width >= MIN_DIMENSIONS.width && 
                       img.height >= MIN_DIMENSIONS.height;
        setDimensions({ width: img.width, height: img.height });
        
        if (!isValid) {
          const errorMsg = `Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px`;
          setError(errorMsg);
          onError?.(errorMsg);
          resolve(false);
          return;
        }
        setError(null);
        resolve(true);
      };
      img.onerror = () => {
        const errorMsg = 'Failed to load image';
        setError(errorMsg);
        onError?.(errorMsg);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }, [onError]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous state
    setError(null);
    setDimensions(null);

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const errorMsg = `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File is too large. Max size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsUploading(true);

    try {
      // Validate image dimensions
      const isValid = await validateImage(file);
      if (!isValid) {
        setIsUploading(false);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to process image';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = async (url: string) => {
    if (!url) {
      setPreview('');
      onChange('');
      setError(null);
      return;
    }

    setIsUploading(true);
    setError(null);
    setDimensions(null);

    try {
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid URL');
      }

      // Check if URL is an image
      const img = new Image();
      img.onload = () => {
        if (img.width < MIN_DIMENSIONS.width || img.height < MIN_DIMENSIONS.height) {
          const errorMsg = `Image must be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height}px`;
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }
        setDimensions({ width: img.width, height: img.height });
        setPreview(url);
        onChange(url);
      };
      img.onerror = () => {
        const errorMsg = 'Failed to load image from URL';
        setError(errorMsg);
        onError?.(errorMsg);
      };
      img.src = url;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Invalid image URL';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    setError(null);
    setDimensions(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-amber-800 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {dimensions && (
          <span className="text-xs text-amber-600">
            {dimensions.width} × {dimensions.height}px
          </span>
        )}
      </div>
      
      {/* Image Preview */}
      {preview ? (
        <div className="relative group">
          <div 
            className={cn(
              'relative w-full bg-amber-50 rounded-lg border-2 border-amber-200 overflow-hidden transition-all duration-200',
              isZoomed ? 'fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4' : 'aspect-video',
              error && 'border-red-300',
              isZoomed && 'cursor-zoom-out',
              !isZoomed && 'cursor-zoom-in'
            )}
            style={{ aspectRatio }}
            onClick={toggleZoom}
          >
            <img
              ref={imgRef}
              src={preview}
              alt="Preview"
              className={cn(
                'w-full h-full object-contain transition-all duration-200',
                isZoomed ? 'max-w-[90vw] max-h-[90vh]' : ''
              )}
            />
            
            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Zoom Indicator */}
            {!isUploading && !isZoomed && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn className="w-8 h-8 text-white/80" />
              </div>
            )}

            {/* Remove Button */}
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className={cn(
                'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity',
                isZoomed && '!opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              Click to exit fullscreen
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-video bg-amber-50 rounded-lg border-2 border-dashed border-amber-200 flex flex-col items-center justify-center p-6 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-amber-300" />
          <p className="text-amber-600 font-medium mb-2">No image selected</p>
          <p className="text-amber-500 text-sm mb-4">Recommended: {MIN_DIMENSIONS.width}×{MIN_DIMENSIONS.height}px or larger</p>
        </div>
      )}

      {/* Upload Options */}
      <div className="space-y-3">
        {/* File Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 h-10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </div>

          {/* URL Input */}
          <div className="relative">
            <Input
              type="url"
              placeholder="Or paste image URL"
              value={preview}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={cn(
                'bg-white/90 border-amber-200 text-amber-800 placeholder:text-amber-400 h-10',
                error && 'border-red-300 focus-visible:ring-red-200'
              )}
              disabled={isUploading}
            />
            {isUploading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-400" />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* File Info */}
        <div className="text-xs text-amber-600 flex items-center justify-between">
          <span>Supported: {ALLOWED_FILE_TYPES.map(t => t.split('/')[1]).join(', ')}</span>
          <span>Max size: {MAX_FILE_SIZE / (1024 * 1024)}MB</span>
        </div>
      </div>
    </div>
  );
}
