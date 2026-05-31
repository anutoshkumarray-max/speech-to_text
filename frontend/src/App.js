import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Mic, Square, FileText, Loader2, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await sendToBackend(audioBlob);
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const sendToBackend = async (data) => {
    setLoading(true);
    setTranscription("");
    
    // Create form data to send the audio file
    const formData = new FormData();
    formData.append('audio', data, 'recording.webm');

    try {
      console.log("📤 Sending request to backend at http://localhost:5000/upload");
      const response = await axios.post('http://127.0.0.1:5001/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
      
      // Successfully received transcription from server
      console.log("✅ Success! Transcription received:", response.data);
      setTranscription(response.data.transcription);
      
    } catch (error) {
      // Log the full error to the browser console for debugging
      console.error("❌ Frontend Error:", error);
      
      if (error.response) {
        // Server responded with a status code outside the 2xx range
        console.error("Server Error Status:", error.response.status);
        console.error("Server Error Data:", error.response.data);
        setTranscription(`⚠️ Server Error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received from server");
        setTranscription("⚠️ Backend unreachable! Is the server running?");
      } else {
        // Something happened in setting up the request
        setTranscription("⚠️ Error setting up the request.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Glow effect definition
  const glowStyle = {
    whileHover: { scale: 1.05, boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.5)" },
    transition: { type: "spring", stiffness: 300 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden font-sans">
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
      <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 12, repeat: Infinity }} className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px]" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            AI Transcriber ✨
          </h1>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Card with Glow */}
          <motion.div {...glowStyle} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 cursor-pointer">
            <Upload className="w-8 h-8 text-blue-400 mb-4" />
            <h2 className="text-xl font-bold mb-4">Upload Audio 📁</h2>
            <input type="file" onChange={(e) => sendToBackend(e.target.files[0])} className="text-sm text-slate-400 w-full file:bg-white/10 file:rounded-full file:px-4 file:py-2 file:border-0 file:text-white hover:file:bg-white/20 cursor-pointer" />
          </motion.div>

          {/* Record Card with Glow */}
          <motion.div {...glowStyle} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 cursor-pointer">
            <Mic className={`w-8 h-8 mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <h2 className="text-xl font-bold mb-4">Live Record 🎙️</h2>
            <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isRecording ? 'bg-red-600' : 'bg-emerald-600'}`}>
              {isRecording ? <><Square size={18}/> Stop Recording</> : <><Play size={18}/> Start Recording</>}
            </button>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 min-h-[200px]">
          <h3 className="flex items-center gap-2 text-slate-300 font-semibold mb-4 uppercase tracking-widest text-sm">
            <FileText size={16} /> Result 📝
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-blue-400"><Loader2 className="animate-spin" /> Processing AI magic...</div>
          ) : (
            <p className="text-slate-200 text-lg leading-relaxed">{transcription || "Your text will appear here..."}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}