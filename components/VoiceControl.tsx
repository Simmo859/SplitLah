import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface Props {
  onVoiceCommand: (audioBase64: string) => void;
  isProcessing: boolean;
}

export const VoiceControl: React.FC<Props> = ({ onVoiceCommand, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' }); // Standard container
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onVoiceCommand(base64);
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isProcessing) {
    return (
      <button disabled className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-3 rounded-full text-sm font-medium transition-all">
        <Loader2 className="animate-spin" size={20} />
        Processing...
      </button>
    );
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all shadow-sm border
        ${isRecording 
          ? 'bg-red-50 text-red-600 border-red-200 animate-pulse ring-2 ring-red-100' 
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-blue-300'
        }
      `}
    >
      {isRecording ? (
        <>
          <Square size={18} fill="currentColor" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic size={18} />
          <span>Voice Split</span>
        </>
      )}
    </button>
  );
};