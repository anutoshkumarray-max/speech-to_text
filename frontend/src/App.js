import React, { useState, useRef } from 'react';
import { Upload, Mic, Square, FileText } from 'lucide-react';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription] = useState(""); // Removed setTranscription as it's not currently used
  
  // Refs to manage MediaRecorder and audio chunks
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    // Request permission to access the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    // Store audio chunks as they become available
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    
    // Once recording stops, create a Blob
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      console.log("Recording stopped, audio blob ready:", audioBlob);
      // Backend integration logic will go here
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    // Stop the media recorder
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background aesthetic glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px]" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Audio Transcriber
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2">
            <Upload className="w-8 h-8 text-blue-400 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Upload Audio</h2>
            <input type="file" className="text-sm text-slate-400 w-full" />
          </div>

          {/* Record Section */}
          <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2">
            <Mic className={`w-8 h-8 mb-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <h2 className="text-2xl font-bold mb-2">Live Recording</h2>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-8 py-3 rounded-full font-bold transition-all ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isRecording ? <div className="flex items-center gap-2"><Square size={18}/> Stop</div> : "Start Recording"}
            </button>
          </div>
        </div>

        {/* Output Display */}
        <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10">
          <h3 className="flex items-center gap-2 text-slate-300 font-semibold mb-4 uppercase tracking-widest text-sm">
            <FileText size={16} /> Transcription
          </h3>
          <p className="text-slate-400">{transcription || "Click record or upload a file..."}</p>
        </div>
      </div>
    </div>
  );
}