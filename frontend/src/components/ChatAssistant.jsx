import { useState, useRef, useEffect } from "react";
import { api } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
  listenOnce,
  speak,
  stopSpeaking,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from "../services/speech";

export default function ChatAssistant({ cropName = "Wheat", position }) {
  const { t, currentLanguage } = useLanguage();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Namaste! Ask me about mandi prices, procurement slots, or crop care." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Clean up ongoing speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSpeak = (text, index) => {
    if (!isSpeechSynthesisSupported()) {
      setError("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingIndex === index) {
      stopSpeaking();
      setSpeakingIndex(null);
    } else {
      stopSpeaking();
      setSpeakingIndex(index);
      speak(text, currentLanguage.speechCode, () => {
        setSpeakingIndex(null);
      });
    }
  };

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    stopSpeaking();
    setSpeakingIndex(null);

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { reply } = await api.chat({
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        cropName,
        lat: position?.lat,
        lng: position?.lng,
        language: currentLanguage.code,
      });

      const updatedMessages = [...nextMessages, { role: "assistant", content: reply }];
      setMessages(updatedMessages);

      const newAssistantIndex = updatedMessages.length - 1;
      if (isSpeechSynthesisSupported()) {
        setSpeakingIndex(newAssistantIndex);
        speak(reply, currentLanguage.speechCode, () => {
          setSpeakingIndex(null);
        });
      }
    } catch (err) {
      setError(err.message || "Failed to fetch response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMicClick() {
    if (!isSpeechRecognitionSupported()) {
      setError("Voice input isn't supported in this browser — try Google Chrome.");
      return;
    }

    stopSpeaking();
    setSpeakingIndex(null);
    setListening(true);
    setError("");

    try {
      const transcript = await listenOnce(currentLanguage.speechCode);
      setListening(false);
      await sendMessage(transcript);
    } catch (err) {
      setListening(false);
      setError(err.message || "Could not recognize speech.");
    }
  }

  return (
    <div className="card !p-0 flex flex-col h-[32rem] shadow-sm rounded-2xl border border-brand-100 bg-white">
      {/* Header */}
      <div className="p-4 border-b border-brand-100 flex items-center justify-between bg-brand-50/50 rounded-t-2xl">
        <div>
          <h3 className="font-display font-bold text-brand-800">{t.aiAssistant || "AI Assistant"}</h3>
          <p className="text-xs text-brand-500">
            Crop context: <span className="font-medium text-brand-700">{cropName}</span> · Speaks {currentLanguage.label}
          </p>
        </div>
        {speakingIndex !== null && (
          <button
            onClick={() => {
              stopSpeaking();
              setSpeakingIndex(null);
            }}
            className="text-xs bg-brand-200 hover:bg-brand-300 text-brand-800 px-2.5 py-1 rounded-full flex items-center gap-1 transition"
          >
            🔊 Stop Audio
          </button>
        )}
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="relative group max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand-600 text-white rounded-br-sm shadow-sm"
                    : "bg-brand-50 text-brand-900 border border-brand-100 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>

              {/* Audio Playback Controls for Assistant */}
              {m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => handleSpeak(m.content, i)}
                  className={`mt-1 text-[11px] font-medium flex items-center gap-1 text-brand-600 hover:text-brand-800 transition ${
                    speakingIndex === i ? "text-emerald-600 font-bold" : ""
                  }`}
                >
                  {speakingIndex === i ? "🔊 Speaking..." : "🔈 Read aloud"}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-brand-500 pl-1">
            <span className="animate-pulse">✨</span> Krishak Sahayak is typing...
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-3 border-t border-brand-100 flex items-center gap-2 bg-white rounded-b-2xl"
      >
        <button
          type="button"
          onClick={handleMicClick}
          disabled={loading}
          className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white transition shadow-sm ${
            listening
              ? "bg-red-500 animate-pulse ring-4 ring-red-200"
              : "bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
          }`}
          title={listening ? "Listening..." : "Voice input"}
        >
          {listening ? "🛑" : "🎙️"}
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening to your query..." : t.askAssistant || "Ask about market prices or crops..."}
          disabled={loading || listening}
          className="input-field flex-1 text-sm rounded-xl border-gray-300 focus:ring-brand-500 disabled:bg-gray-50"
        />

        <button
          type="submit"
          disabled={loading || !input.trim() || listening}
          className="btn-primary !px-5 !py-2.5 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {t.send || "Send"}
        </button>
      </form>
    </div>
  );
}
