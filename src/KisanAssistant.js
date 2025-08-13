import React, { useState, useRef } from "react";
import Recorder from "./Recorder";

const AVATAR = "/women.png"; // or "/male.png" if you want to toggle gender

const KisanAssistant = () => {
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRefs = useRef({});
  const [playingIdx, setPlayingIdx] = useState(null);

  // Use only jarvis_hindi_audio API
  const handleRecorded = async (audioBlob, transcriptText = "", sampleRate = 48000) => {
    setListening(false);
    setLoading(true);
    setTranscript((prev) => [
      ...prev,
      { speaker: "user", text: transcriptText || "[वॉयस इनपुट भेजा गया]" },
    ]);
    if (!audioBlob || audioBlob.size < 2000) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "सहायक", text: "कोई वॉयस इनपुट नहीं मिला।" },
      ]);
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "voice.wav");
    formData.append("sample_rate_hertz", sampleRate);
    try {
      const res = await fetch("http://localhost:8000/jarvis_hindi_audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.user_text) {
        setTranscript((prev) => [
          ...prev,
          { speaker: "user", text: data.user_text },
        ]);
      }
      if (data && data.reply_text) {
        const idx = transcript.length + (data.user_text ? 2 : 1);
        setTranscript((prev) => [
          ...prev,
          { speaker: "सहायक", text: data.reply_text, audio_url: data.audio_url },
        ]);
        if (data.audio_url) {
          const baseUrl = "http://localhost:8000";
          const url = data.audio_url.startsWith("http") ? data.audio_url : baseUrl + data.audio_url;
          const audio = new Audio(url);
          audioRefs.current[idx] = audio;
          setPlayingIdx(idx);
          audio.play();
          audio.onended = () => setPlayingIdx(null);
        }
      }
    } catch (err) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "सहायक", text: "सर्वर से उत्तर प्राप्त नहीं हुआ।" },
      ]);
    }
    setLoading(false);
  };

  const handlePlayAudio = (idx, audioUrl) => {
    if (playingIdx !== null && audioRefs.current[playingIdx]) {
      audioRefs.current[playingIdx].pause();
      audioRefs.current[playingIdx].currentTime = 0;
    }
    if (audioRefs.current[idx]) {
      audioRefs.current[idx].play();
    } else {
      const baseUrl = "http://localhost:8000";
      const url = audioUrl.startsWith("http") ? audioUrl : baseUrl + audioUrl;
      const audio = new Audio(url);
      audioRefs.current[idx] = audio;
      audio.play();
    }
    setPlayingIdx(idx);
  };

  const handleStopAudio = (idx) => {
    if (audioRefs.current[idx]) {
      audioRefs.current[idx].pause();
      audioRefs.current[idx].currentTime = 0;
      setPlayingIdx(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#eaf6fb] via-[#f7faff] to-[#e3f0ff] relative">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-8 py-4 absolute top-0 left-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#0a3d62] tracking-wide drop-shadow">
            किसान सहायक
          </span>
        </div>
        <span className="text-base font-medium text-blue-900">
          कृषि संबंधित सवाल पूछें
        </span>
      </div>
      {/* Main Interaction Zone */}
      <div className="flex flex-row w-full h-screen pt-28 pb-8 px-8 gap-8">
        {/* Left: AI Avatar & Voice Zone */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Animated Avatar */}
          <div className="relative flex flex-col items-center">
            <div
              className={`absolute inset-0 rounded-full pointer-events-none ${
                listening
                  ? "animate-glow bg-green-200/60 blur-2xl"
                  : "bg-transparent"
              }`}
            />
            <img
              src={AVATAR}
              alt="AI Avatar"
              className={`w-56 h-56 rounded-full object-cover border-4 border-white shadow-xl z-10 avatar-shimmer ${
                listening ? "ring-8 ring-green-200/60" : ""
              }`}
              style={{
                filter: "drop-shadow(0 0 60px #00eaff66)",
                transition: "box-shadow 0.3s",
                background:
                  "linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)",
              }}
            />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-64 h-8 rounded-full bg-gradient-to-r from-green-200/60 via-cyan-200/60 to-pink-200/60 blur-2xl opacity-80 pointer-events-none" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              {listening ? (
                <span className="block w-20 h-5 rounded-full bg-green-300/80 animate-pulse" />
              ) : (
                <span className="block w-20 h-5 rounded-full bg-pink-200/60" />
              )}
            </div>
          </div>
          <Recorder
            listening={listening}
            setListening={setListening}
            onRecorded={handleRecorded}
            setLiveUserText={() => {}}
            language="hi"
          />
          {loading && (
            <div className="my-2 text-green-700 font-semibold flex items-center gap-2 justify-center">
              <span className="animate-spin inline-block w-5 h-5 border-4 border-green-300 border-t-transparent rounded-full"></span>
              <span>उत्तर तैयार किया जा रहा है...</span>
            </div>
          )}
        </div>
        {/* Right: Transcript Section */}
        <div className="w-full max-w-2xl mx-auto mt-2 mb-8 bg-white/80 rounded-2xl shadow-lg p-6 glass-scroll">
          <h2 className="text-xl font-bold text-green-900 mb-4">
            बातचीत (कृषि चैट)
          </h2>
          <div style={{ overflowY: "auto" }}>
            {transcript.length === 0 ? (
              <div className="text-green-700">कोई बातचीत नहीं हुई।</div>
            ) : (
              transcript.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: line.speaker === "user" ? "#388e3c" : "#e17055",
                      minWidth: 70,
                      display: "inline-block",
                    }}
                  >
                    {line.speaker === "user" ? "किसान:" : "सहायक:"}
                  </span>
                  <span style={{ color: "#222", fontSize: "1rem", flex: 1 }}>
                    {line.text}
                  </span>
                  {line.audio_url && (
                    <span className="ml-2 flex gap-2">
                      <button
                        className={`px-2 py-1 rounded font-bold ${
                          playingIdx === idx
                            ? "bg-green-400 text-white"
                            : "bg-green-200 hover:bg-green-400"
                        }`}
                        onClick={() => handlePlayAudio(idx, line.audio_url)}
                      >
                        ▶️ सुनें
                      </button>
                      <button
                        className="px-2 py-1 bg-red-200 rounded hover:bg-red-400 font-bold"
                        onClick={() => handleStopAudio(idx)}
                        disabled={playingIdx !== idx}
                      >
                        ⏹️ रोकें
                      </button>
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KisanAssistant;