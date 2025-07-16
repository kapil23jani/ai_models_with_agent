import React, { useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Recorder = ({
  listening,
  setListening,
  onRecorded,
  setLiveUserText,
  language,
  onReminder,
}) => {
  const location = useLocation(); // <-- Get current route
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null); // <-- fix: useRef for stream
  const [welcomePlayed, setWelcomePlayed] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Play welcome note on first mic click
  const handleMicClick = async () => {
    if (!welcomePlayed) {
      try {
        // Use different welcome API for /kisan route
        const apiUrl = location.pathname.includes("/kisan")
          ? "http://localhost:8000/jarvis_welcome"
          : "http://localhost:8000/api/complaint/start_no_session_audio_in";

        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();

        // Show the prompt in transcript (call a prop or use context)
        if (data && data.prompt) {
          // You may want to call a prop like onWelcomePrompt(data.prompt)
          // Or update transcript in App.js via a callback
        }

        // Play the welcome audio
        if (data && data.audio_url) {
          const baseUrl = "http://localhost:8000";
          const audioUrl = data.audio_url.startsWith("http")
            ? data.audio_url
            : baseUrl + data.audio_url;
          const welcomeAudio = new Audio(audioUrl);
          welcomeAudio.onended = () => {
            setListening(true); // Start mic after audio finishes
          };
          welcomeAudio.play();
        } else {
          setListening(true); // Fallback: start mic if no audio
        }
        setWelcomePlayed(true);
      } catch (err) {
        setListening(true); // Fallback: start mic if error
      }
    } else {
      setListening(!listening);
      console.log("Toggling listening:", !listening);
    }
  };

  useEffect(() => {
    console.log("Listening state changed:", listening);
    if (listening) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
        console.log("Microphone stream started");
        streamRef.current = s;
        mediaRecorderRef.current = new window.MediaRecorder(s);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
          console.log("Recording stopped");
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" }); // use webm for compatibility
          setAudioUrl(URL.createObjectURL(audioBlob)); // <-- create preview URL
          onRecorded(audioBlob, "");
        };
        mediaRecorderRef.current.start();
        console.log("MediaRecorder started");
      }).catch((err) => {
        console.error("Microphone error:", err);
        setListening(false);
        onRecorded(null, "");
        alert("Microphone permission denied or not available.");
      });
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        console.log("MediaRecorder stopped");
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        console.log("Microphone stream stopped");
      }
    }
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        console.log("Cleanup: MediaRecorder stopped");
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        console.log("Cleanup: Microphone stream stopped");
      }
    };
  }, [listening, onRecorded, setListening]);

  const handleRecorded = (audioBlob) => {
    console.log("Audio blob received:", audioBlob);
    // ...rest of your logic...
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        className={`rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 p-7 shadow-xl hover:scale-105 transition-all ${
          listening ? "animate-pulse" : ""
        }`}
        onClick={handleMicClick}
        aria-label="Mic"
      >
        <svg
          width={40}
          height={40}
          fill="none"
          viewBox="0 0 24 24"
          className={`${listening ? "text-blue-400" : "text-blue-900"}`}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            className={listening ? "animate-pulse" : ""}
          />
          <path
            d="M12 17v2m0 0h3m-3 0H9m6-6a3 3 0 01-6 0V7a3 3 0 016 0v6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <span className="mt-2 text-blue-900/80 text-lg font-semibold tracking-wide">
        {listening ? "Listening..." : "Tap to Speak"}
      </span>
      {listening && (
        <button
          className="mt-4 px-4 py-2 rounded bg-red-500 text-white font-bold shadow hover:bg-red-600"
          onClick={() => setListening(false)}
        >
          Abort
        </button>
      )}
      {listening && (
        <div className="flex gap-1 mt-4">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded bg-gradient-to-b from-cyan-400 to-blue-400 animate-wave"
              style={{
                height: `${18 + Math.random() * 38}px`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recorder;