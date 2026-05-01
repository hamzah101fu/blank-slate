import { useRef, useState } from "react";
import type { QuestionProps } from "./shared";

export function AudioPlay({ content, onAnswer, feedback }: QuestionProps) {
  const { audio_url, transcript } = content;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const disabled = feedback !== "idle";

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }
    audio.play();
    setPlaying(true);
    setPlayed(true);
  };

  const handleEnded = () => setPlaying(false);

  const handleConfirm = () => {
    if (!played || disabled) return;
    onAnswer(true); // listening question — always correct once played
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Listen carefully
      </p>

      {/* Audio element */}
      <audio ref={audioRef} src={audio_url} onEnded={handleEnded} />

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={disabled}
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          backgroundColor: playing ? "#C17B4A" : "#D4A853",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.15s",
        }}
        aria-label={playing ? "Stop audio" : "Play audio"}
      >
        {playing ? (
          // Pause icon
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Transcript (shown after playing) */}
      {played && transcript && (
        <div
          style={{
            backgroundColor: "#FAF6F0",
            border: "2px solid #E8E0D5",
            borderRadius: 16,
            padding: "14px 20px",
            width: "100%",
            textAlign: "right",
            direction: "rtl",
            fontFamily: "'Amiri', serif",
            fontSize: 22,
            color: "#1E2D3D",
            lineHeight: 1.7,
          }}
        >
          {transcript}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!played || disabled}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 16,
          backgroundColor: played && !disabled ? "#1E2D3D" : "#E8E0D5",
          color: played && !disabled ? "#FAF6F0" : "#1E2D3D",
          border: "none",
          fontWeight: 600,
          fontSize: 15,
          cursor: played && !disabled ? "pointer" : "default",
          transition: "background-color 0.15s",
          opacity: played ? 1 : 0.5,
        }}
      >
        {played ? "Continue" : "Play the audio first"}
      </button>
    </div>
  );
}
