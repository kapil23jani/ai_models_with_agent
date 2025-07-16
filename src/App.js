import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import Recorder from "./Recorder";
import KisanAssistant from "./KisanAssistant";
import Transcript from "./Transcript";

const GOVT_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAjVBMVEVHcEywjDquijatijSuizi0lEqviziuizauijarhSq7nV2ogh6qhCO7nVjLtIPGqYnCqHHMq6Xj0NLGnp/q3N329PTY1tjQs63Turz///+ho6Pi4+Pw6emLjIzazMlyc3O+kJG0fXqvcnGoZGWfUlOLIiTawsO4hIV+AACUOjyYRUaPLjCFCxG8knjZx6bcUPcbAAAADnRSTlMAIWDY//826X3////xECkJ0KcAAAIoSURBVHgBdVPpwqogEJXCCilCBAUlrgIitvj+j3fJb98O/5h95pzsGwDI/sZmCwDMwW6/+c162GWowEcIj7hA2e7w3X7KkwWScwKBGMH89M2+QZiWrOKirhkrKUabLx45wnnDpGq7rq2VrlmTY5R/ikeQyk5caiFZw5RpL0pSiE4f+TGV9T/N+8Fa50cZOi0DxW9VDjnKU3Yj7WTH6Gd3tU13ETJ9v8yyg7ipO2WC7Z29+au9z96qrm4w3GUrEGVtW7lqvE/VtXKpir1WsmX0uJrTgKVSepy8m8abs1r6xrnIlSoxeu50X0AWmt6Nt5LPMUY3j2F2cQgNg8X22QImTKlpkLebj/5xvsV7jOPolWIEP08HjmdRyn6omBuXhZBlufm+ujrO+PkIkh3Cs/BlsDxMD0KfGHRlJ898OCMIVgduG1MyWd1JkUC8qnSvjCvPMN+tJYwMnHHOI82LAhaV4jo9L9cSGcAkDCwww/lsU41i6BUTWjsuCX5ualtA7ivGdeDzzSyLcTdRKiGtT2PuXxfFRt2Yyd2HNAR5xKERfPAhLerwumo+lf1tmCNZx7g6N9q+ZBRl78dSTqQN3lI8XYgbr9ZO5Xqsj3MH1cdoKSX0EWOvuPo4dwaehFFKaBtXWG2Ukokw4AvlxKUTihvDlejabqXcN9Ia3XaXrhYXbfg30manV9qzWiTivtL+9F046ItwwF/SQ39IbyXffgdyCMD2V/H+Jf//fM09aK0KlhQAAAAASUVORK5CYII=";
const DIGITAL_INDIA = "https://www.digitalindiaportal.co.in/images/logof1.png";

const LANGUAGES = [
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
];

function App() {
  const [language, setLanguage] = useState("hi");
  const [gender, setGender] = useState("female");
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [activeMic, setActiveMic] = useState(null);

  const [sessionId, setSessionId] = useState(null);
  const [nextFieldToAsk, setNextFieldToAsk] = useState("");
  const [currentData, setCurrentData] = useState({});

  const [showKisan, setShowKisan] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRefs = useRef({}); // Store refs for each audio

  const AVATAR = gender === "male" ? "/male.png" : "/women.png";

  const [transcriptText, setTranscriptText] = useState("");

  const handleRecorded = async (
    audioBlob,
    transcriptText = "",
    sampleRate = 48000
  ) => {
    setListening(false);
    setActiveMic(null);

    setTranscript((prev) => [
      ...prev,
      { speaker: "user", text: transcriptText || "[वॉयस इनपुट भेजा गया]" },
    ]);

    if (!audioBlob || audioBlob.size < 2000) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "sahayak", text: "कोई वॉयस इनपुट नहीं मिला।" },
      ]);
      return;
    }

    setLoading(true); // Show spinner while waiting for response

    // Update currentData with user's answer for the last asked field
    const updatedData = { ...currentData, [nextFieldToAsk]: transcriptText };

    const formData = new FormData();
    formData.append("audio_file", audioBlob, "voice.wav");
    formData.append("sample_rate_hertz", sampleRate);
    formData.append("next_field_to_ask", nextFieldToAsk);
    formData.append("current_data_json", JSON.stringify(updatedData));

    try {
      const res = await fetch(
        "http://localhost:8000/api/complaint/talk_no_session_audio_in",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      console.log("talk_no_session_audio_in response:", data);

      if (data && data.reply_text) {
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "sahayak",
            text: data.reply_text,
            audio_url: data.audio_url,
          },
        ]);
        // Auto play audio after response
        if (data.audio_url) {
          const baseUrl = "http://localhost:8000";
          const audioUrl = data.audio_url.startsWith("http")
            ? data.audio_url
            : baseUrl + data.audio_url;
          const audio = new Audio(audioUrl);
          audioRefs.current[transcript.length] = audio;
          audio.play();
        }
      } else if (data && data.prompt) {
        setTranscript((prev) => [
          ...prev,
          { speaker: "sahayak", text: data.prompt, audio_url: data.audio_url },
        ]);
        if (data.audio_url) {
          const baseUrl = "http://localhost:8000";
          const audioUrl = data.audio_url.startsWith("http")
            ? data.audio_url
            : baseUrl + data.audio_url;
          const audio = new Audio(audioUrl);
          audioRefs.current[transcript.length] = audio;
          audio.play();
        }
      } else {
        setTranscript((prev) => [
          ...prev,
          { speaker: "sahayak", text: "कोई उत्तर प्राप्त नहीं हुआ।" },
        ]);
      }

      if (data && data.next_field_to_ask)
        setNextFieldToAsk(data.next_field_to_ask);
      if (data && data.current_data) setCurrentData(data.current_data);

      if (data && data.done && data.current_data) {
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "sahayak",
            text: `✅ आपकी शिकायत दर्ज कर ली गई है। धन्यवाद!\n\nसारांश:\nनाम: ${
              data.current_data.name || ""
            }\nमोबाइल: ${data.current_data.mobile || ""}\nपता: ${
              data.current_data.address || ""
            }\nसमस्या: ${data.current_data.problem || ""}`,
          },
        ]);
      }
    } catch (err) {
      setTranscript((prev) => [
        ...prev,
        { speaker: "sahayak", text: "सर्वर से उत्तर प्राप्त नहीं हुआ।" },
      ]);
    }
    setLoading(false); // Hide spinner after response
  };

  // Play audio for a specific transcript line
  const handlePlayAudio = (idx, audioUrl) => {
    if (audioRefs.current[idx]) {
      audioRefs.current[idx].play();
    } else if (audioUrl) {
      const baseUrl = "http://localhost:8000";
      const url = audioUrl.startsWith("http") ? audioUrl : baseUrl + audioUrl;
      const audio = new Audio(url);
      audioRefs.current[idx] = audio;
      audio.play();
    }
  };

  // Stop audio for a specific transcript line
  const handleStopAudio = (idx) => {
    if (audioRefs.current[idx]) {
      audioRefs.current[idx].pause();
      audioRefs.current[idx].currentTime = 0;
    }
  };

  function getSessionId(currentId) {
    if (currentId && typeof currentId === "string" && currentId.length > 0)
      return currentId;
    return "sess_" + Math.random().toString(36).substr(2, 12);
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-[#eaf6fb] via-[#f7faff] to-[#e3f0ff] relative">
              <div className="w-full flex justify-between items-center px-8 py-4 absolute top-0 left-0 z-20">
                <div className="flex items-center gap-3">
                  <img
                    src={GOVT_LOGO}
                    alt="Govt Logo"
                    className="h-10 w-10 rounded-full shadow"
                  />
                  <span className="text-2xl font-bold text-[#0a3d62] tracking-wide drop-shadow">
                    AI Complaint Kiosk
                  </span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/60 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 text-lg shadow focus:outline-none"
                  style={{ minWidth: 120 }}
                >
                  {LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="text-black"
                    >
                      {lang.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-4">
                  <button
                    className={`rounded-full p-2 transition-all ${
                      gender === "male"
                        ? "bg-blue-200 ring-4 ring-blue-400"
                        : "bg-white/60"
                    }`}
                    onClick={() => setGender("male")}
                    aria-label="Male AI"
                  >
                    <img
                      src="/male.png"
                      alt="Male AI"
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </button>
                  <button
                    className={`rounded-full p-2 transition-all ${
                      gender === "female"
                        ? "bg-pink-200 ring-4 ring-pink-400"
                        : "bg-white/60"
                    }`}
                    onClick={() => setGender("female")}
                    aria-label="Female AI"
                  >
                    <img
                      src="/women.png"
                      alt="Female AI"
                      className="w-10 h-10 object-cover rounded-full"
                    />
                  </button>
                  <img
                    src={DIGITAL_INDIA}
                    alt="Digital India"
                    className="h-10 w-auto ml-4"
                  />
                </div>
              </div>

              {/* Main Interaction Zone */}
              <div className="flex flex-row w-full h-screen pt-28 pb-8 px-8 gap-8">
                {/* Left: AI Avatar & Voice Zone */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  {/* Animated Avatar */}
                  <div className="relative flex flex-col items-center">
                    {/* Halo animation */}
                    <div
                      className={`absolute inset-0 rounded-full pointer-events-none ${
                        listening
                          ? "animate-glow bg-blue-200/60 blur-2xl"
                          : "bg-transparent"
                      }`}
                      style={{ width: 220, height: 220, zIndex: 1 }}
                    />
                    {/* Avatar */}
                    <img
                      src={AVATAR}
                      alt="AI Avatar"
                      className={`w-56 h-56 rounded-full object-cover border-4 border-white shadow-xl z-10 avatar-shimmer ${
                        listening ? "ring-8 ring-blue-200/60" : ""
                      }`}
                      style={{
                        filter: "drop-shadow(0 0 60px #00eaff66)",
                        transition: "box-shadow 0.3s",
                        background:
                          "linear-gradient(135deg, #f8fafc 60%, #e0e7ef 100%)",
                      }}
                    />
                    {/* Floating halo */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-64 h-8 rounded-full bg-gradient-to-r from-blue-200/60 via-cyan-200/60 to-pink-200/60 blur-2xl opacity-80 pointer-events-none" />
                    {/* Lip-sync/facial animation placeholder */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                      {listening ? (
                        <span className="block w-20 h-5 rounded-full bg-blue-300/80 animate-pulse" />
                      ) : (
                        <span className="block w-20 h-5 rounded-full bg-pink-200/60" />
                      )}
                    </div>
                  </div>
                  <Recorder
                    listening={listening}
                    setListening={setListening}
                    onRecorded={handleRecorded}
                    setLiveUserText={setTranscriptText}
                    language={language}
                    onWelcomePrompt={(prompt) =>
                      setTranscript((prev) => [
                        ...prev,
                        { speaker: "sahayak", text: prompt },
                      ])
                    }
                    onReminder={() =>
                      setTranscript((prev) => [
                        ...prev,
                        {
                          speaker: "sahayak",
                          text: "कृपया अपनी समस्या बताएं।",
                        },
                      ])
                    }
                  />
                  {loading && (
                    <div className="my-2 text-blue-700 font-semibold flex items-center gap-2 justify-center">
                      <span className="animate-spin inline-block w-5 h-5 border-4 border-blue-300 border-t-transparent rounded-full"></span>
                      <span>उत्तर तैयार किया जा रहा है...</span>
                    </div>
                  )}
                </div>
                {/* Right: Transcript Section */}
                <div className="w-full max-w-2xl mx-auto mt-2 mb-8 bg-white/80 rounded-2xl shadow-lg p-6 glass-scroll">
                  <h2 className="text-xl font-bold text-blue-900 mb-4">
                    Conversation Transcript
                  </h2>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {transcript.length === 0 ? (
                      <div className="text-gray-500">No conversation yet.</div>
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
                              fontWeight: 600,
                              color:
                                line.speaker === "user" ? "#0d6efd" : "#e17055",
                              minWidth: 70,
                              display: "inline-block",
                            }}
                          >
                            {line.speaker === "user" ? "You:" : "सहायक:"}
                          </span>
                          <span style={{ color: "#222", fontSize: "1rem" }}>
                            {line.text}
                          </span>
                          {/* Play/Stop buttons for sahayak audio */}
                          {line.audio_url && (
                            <span className="ml-2 flex gap-2">
                              <button
                                className="px-2 py-1 bg-blue-200 rounded hover:bg-blue-400"
                                onClick={() =>
                                  handlePlayAudio(idx, line.audio_url)
                                }
                              >
                                ▶️ सुनें
                              </button>
                              <button
                                className="px-2 py-1 bg-red-200 rounded hover:bg-red-400"
                                onClick={() => handleStopAudio(idx)}
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
          }
        />
        <Route path="/kisan" element={<KisanAssistant />} />
      </Routes>
    </Router>
  );
}

export default App;
