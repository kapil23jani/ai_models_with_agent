import React from "react";

const Transcript = ({ transcript, handlePlayAudio, handleStopAudio }) => (
  <div
    className="w-full max-w-2xl mx-auto mt-2 mb-8 bg-white/80 rounded-2xl shadow-lg p-6 glass-scroll"
    style={{
      position: "relative",
      zIndex: 10,
      fontFamily: "Segoe UI, sans-serif",
      border: "1px solid #e3e8ee",
    }}
  >
    <h2 className="text-xl font-bold text-blue-900 mb-4">
      Conversation Transcript
    </h2>
    <div>
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
                color: line.speaker === "user" ? "#0d6efd" : "#e17055",
                minWidth: 70,
                display: "inline-block",
              }}
            >
              {line.speaker === "user" ? "You:" : "सहायक:"}
            </span>
            <span style={{ color: "#222", fontSize: "1rem" }}>
              {line.text}
            </span>
            {line.audio_url && (
              <span className="ml-2 flex gap-2">
                <button
                  className="px-2 py-1 bg-blue-200 rounded hover:bg-blue-400"
                  onClick={() => handlePlayAudio(idx, line.audio_url)}
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
);

export default Transcript;