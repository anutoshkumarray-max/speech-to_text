import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Mic, Square, FileText, Loader2, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import History from './History';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: 'audio/webm'
        });

        await sendToBackend(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      setTranscription("Microphone access denied!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToBackend = async (data) => {
    setLoading(true);
    setTranscription("");

    const formData = new FormData();
    formData.append('audio', data, 'recording.webm');

    try {
      const response = await axios.post(
        'http://localhost:5001/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setTranscription(response.data.transcription);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Upload Error:', error);

      if (error.response) {
        setTranscription(
          `Server Error: ${error.response.status} - ${
            error.response.data.error || 'Unknown Error'
          }`
        );
      } else {
        setTranscription(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const glowStyle = {
    whileHover: {
      scale: 1.05,
      boxShadow: "0px 0px 30px rgba(59, 130, 246, 0.5)"
    },
    transition: {
      type: "spring",
      stiffness: 300
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 relative overflow-hidden font-sans">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity
        }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"
      />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        <h1 className="text-6xl font-black text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          AI Transcriber ✨
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            {...glowStyle}
            className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/10"
          >
            <Upload className="w-8 h-8 text-blue-400 mb-4" />

            <h2 className="text-xl font-bold mb-4">
              Upload Audio 📁
            </h2>

            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  sendToBackend(e.target.files[0]);
                }
              }}
              className="w-full text-sm text-slate-400 file:bg-white/10 file:rounded-full file:px-4 file:py-2 file:border-0"
            />
          </motion.div>

          <motion.div
            {...glowStyle}
            className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/10"
          >
            <Mic
              className={`w-8 h-8 mb-4 ${
                isRecording ? 'text-red-500' : 'text-emerald-400'
              }`}
            />

            <h2 className="text-xl font-bold mb-4">
              Live Record 🎙️
            </h2>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold ${
                isRecording ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            >
              {isRecording ? (
                <>
                  <Square size={18} />
                  Stop
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start
                </>
              )}
            </button>
          </motion.div>
        </div>

        <motion.div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/10 min-h-[200px]">
          <h3 className="flex items-center gap-2 text-slate-300 font-semibold mb-4">
            <FileText size={16} />
            Result 📝
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader2 className="animate-spin" />
              Processing...
            </div>
          ) : (
            <p>{transcription || "Waiting for audio..."}</p>
          )}
        </motion.div>

        <History refreshTrigger={refreshKey} />
      </div>
    </div>
  );
}