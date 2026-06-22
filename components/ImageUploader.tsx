import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelect(reader.result);
      }
    };
    reader.onerror = () => setError('Could not read that image. Please try a different file.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          processFile(event.dataTransfer.files?.[0]);
        }}
        className={`bg-white border-2 border-dashed rounded-3xl p-10 md:p-14 text-center cursor-pointer transition-all shadow-sm ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => processFile(event.target.files?.[0])}
        />
        <div className="w-20 h-20 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6">
          {isDragging ? <UploadCloud size={38} /> : <ImageIcon size={38} />}
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Upload a sketch or drawing</h3>
        <p className="text-slate-500 max-w-xl mx-auto">
          Drag and drop an image here, or click to choose one. Clear, high-contrast drawings work best.
        </p>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
};
