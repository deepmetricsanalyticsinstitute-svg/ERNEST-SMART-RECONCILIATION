import React, { useRef, useState } from 'react';
import { Icons } from './Icons';

interface FileUploadProps {
  label: string;
  accept: string;
  onFileSelect: (file: File, content: string, type: 'pdf' | 'csv') => void;
  fileData: { file: File; type: 'pdf' | 'csv' } | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, onFileSelect, fileData }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const type = isPdf ? 'pdf' : 'csv';

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(file, content, type);
    };
    if (isPdf) {
      reader.readAsDataURL(file); // PDF needs base64
    } else {
      reader.readAsText(file); // CSV is better as text for the prompt context
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center h-64
        ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
        ${fileData ? 'bg-white border-brand-200 shadow-sm' : 'bg-white'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      
      {fileData ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className={`p-4 rounded-full mb-3 ${fileData.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {fileData.type === 'pdf' ? <Icons.Pdf size={32} /> : <Icons.Csv size={32} />}
          </div>
          <h3 className="font-semibold text-slate-900 truncate max-w-[200px]">{fileData.file.name}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {(fileData.file.size / 1024).toFixed(1)} KB
          </p>
          <div className="mt-4 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Icons.Check size={12} /> Ready
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
           <div className={`p-4 rounded-full mb-3 bg-slate-100 text-slate-400 group-hover:scale-110 transition-transform duration-300`}>
             <Icons.Upload size={32} />
           </div>
          <h3 className="font-semibold text-slate-700">{label}</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-[200px]">
            Drag & drop or click to upload PDF or CSV
          </p>
        </div>
      )}
    </div>
  );
};
