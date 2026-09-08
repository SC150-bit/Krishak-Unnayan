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
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
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
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (isSpeechSynthesisSupported()) speak(reply, currentLanguage.speechCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMicClick() {
    if (!isSpeechRecognitionSupported()) {
      setError("Voice input isn't supported in this browser — try Chrome.");
      return;
    }
    stopSpeaking();
    setListening(true);
    try {
      const transcript = await listenOnce(currentLanguage.speechCode);
      setListening(false);
      await sendMessage(transcript);
    } catch (err) {
      setListening(false);
      setError(err.message);
    }
  }

  return (
    <div className="card !p-0 flex flex-col h-[32rem]">
      <div className="p-5 border-b border-brand-100">
        <h3 className="font-display font-bold text-brand-800">{t.aiAssistant}</h3>
        <p className="text-xs text-brand-500">Crop context: {cropName} · Speaks {currentLanguage.label}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-brand-600 text-white rounded-br-sm" : "bg-brand-50 text-brand-800 rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-brand-400 pl-1">Krishak Sahayak is typing…</div>}
        {error && <div className="text-xs text-red-600 pl-1">{error}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-4 border-t border-brand-100 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleMicClick}
          className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white ${
            listening ? "bg-red-500 mic-pulse" : "bg-brand-500 hover:bg-brand-600"
          }`}
          title="Voice input"
        >
          🎙️
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.askAssistant}
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary !px-5 !py-2.5 text-sm">
          {t.send}
        </button>
      </form>
    </div>
  );
}
