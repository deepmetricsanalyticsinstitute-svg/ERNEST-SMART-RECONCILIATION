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
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
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
    <div className="flex flex-col items-center w-full">
      <h3 className="text-white font-bold text-lg mb-1">{label}</h3>
      <p className="text-slate-500 text-[10px] mb-5 uppercase tracking-widest font-semibold">
        {label === 'Bank Statement' ? 'Upload PDF or CSV statement.' : 'Upload Excel, CSV or PDF ledger.'}
      </p>
      
      <div
        className={`relative w-full border border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-500/5' 
            : 'border-slate-700/60 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40'}
          ${fileData ? 'border-indigo-500/40 bg-indigo-500/5' : ''}
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
        
        <div className={`mb-4 transition-transform group-hover:scale-110 duration-300 ${fileData ? 'text-indigo-400' : 'text-slate-500'}`}>
          <Icons.Upload size={36} strokeWidth={1.5} />
        </div>
        
        {fileData ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <span className="text-indigo-400 text-sm font-bold block truncate max-w-[200px]">{fileData.file.name}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 block">Click to change</span>
          </div>
        ) : (
          <div>
            <span className="text-slate-200 font-bold text-sm tracking-wide">Choose File</span>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">
              Drag and drop or click to browse
            </p>
          </div>
        )}
      </div>
    </div>
  );
};