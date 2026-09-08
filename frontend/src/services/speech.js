// Thin wrapper around the browser's Web Speech API for voice input (STT)
// and voice output (TTS). Falls back gracefully when unsupported.

const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechRecognitionSupported() {
  return Boolean(SpeechRecognitionImpl);
}

export function isSpeechSynthesisSupported() {
  return "speechSynthesis" in window;
}

/**
 * Starts listening once and resolves with the recognized transcript.
 * @param {string} langCode - BCP-47 code, e.g. "hi-IN", "bn-IN", "en-IN"
 */
export function listenOnce(langCode = "en-IN") {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognitionImpl) {
      reject(new Error("Speech recognition is not supported in this browser."));
      return;
    }
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = (event) => reject(new Error(event.error || "Speech recognition error"));
    recognition.start();
  });
}

/**
 * Speaks the given text aloud in the given language.
 * @param {string} text
 * @param {string} langCode - BCP-47 code, e.g. "hi-IN"
 */
export function speak(text, langCode = "en-IN") {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === langCode) || voices.find((v) => v.lang?.startsWith(langCode.split("-")[0]));
  if (match) utterance.voice = match;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
