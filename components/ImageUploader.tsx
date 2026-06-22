import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string, file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Helper to resize and compress image
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1536; // Reduce resolution for API performance

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to high-quality JPEG to reduce file size but keep detail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsProcessing(true);

    try {
      // Resize the image before passing it up
      const resizedBase64 = await resizeImage(file);
      onImageSelect(resizedBase64, file);
    } catch (err) {
      console.error("Image processing failed, falling back to original", err);
      // Fallback: Read as is if resize fails
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          onImageSelect(e.target.result, file);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer
          border-3 border-dashed rounded-3xl p-10
          flex flex-col items-center justify-center text-center
          transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        
        <div className={`
          p-5 rounded-full mb-4 transition-colors duration-300
          ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}
        `}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          ) : (
             isDragging ? <UploadCloud size={40} /> : <ImageIcon size={40} />
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-700 mb-2">
          {isProcessing ? 'Optimizing Image...' : (isDragging ? 'Drop it here!' : 'Upload your sketch')}
        </h3>
        
        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
          {isProcessing 
            ? 'We are resizing your photo for better performance...'
            : 'Drag and drop your image here, or tap to browse your files.'
          }
          <br/>
          {!isProcessing && <span className="text-xs text-slate-400 mt-2 block">(Supports JPG, PNG, WEBP)</span>}
        </p>

        <div className={`
          pointer-events-none bg-white text-slate-700 px-6 py-2.5 rounded-xl border border-slate-200 shadow-sm font-semibold text-sm group-hover:border-indigo-300 group-hover:shadow-md transition-all
          ${isProcessing ? 'opacity-50' : ''}
        `}>
          Select Image
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 opacity-60">
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse delay-75"></div>
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse delay-150"></div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-3">Examples of what you can create</p>
    </div>
  );
};