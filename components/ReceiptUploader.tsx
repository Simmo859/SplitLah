import React, { useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface Props {
  onImageSelected: (base64: string) => void;
  isProcessing: boolean;
}

export const ReceiptUploader: React.FC<Props> = ({ onImageSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center w-24 h-24 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-500 transition-all"
        >
          <Upload size={24} className="mb-2" />
          <span className="text-xs font-medium">Upload</span>
        </button>
        
        <button
           onClick={() => fileInputRef.current?.click()} // On mobile this triggers camera option usually
           disabled={isProcessing}
           className="flex flex-col items-center justify-center w-24 h-24 bg-blue-50 rounded-lg shadow-sm border border-blue-200 text-blue-600 hover:bg-blue-100 transition-all"
        >
          <Camera size={24} className="mb-2" />
          <span className="text-xs font-medium">Camera</span>
        </button>
      </div>

      <p className="text-sm text-slate-500 text-center max-w-xs">
        Take a clear photo of the receipt. We support standard Singapore tax invoices.
      </p>
    </div>
  );
};
