import React, { useState } from 'react';

export default function AiAssistantModal({ onClose, user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Namaste ${user.name}! I am your AI Krishi Helper. Ask me anything about your current appointment, crop prices, or agricultural guidance.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: input,
          farmerContext: { name: user.name, location: 'Karnal, Haryana', token: 'T-104' }
        })
      });

      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', text: 'Error fetching reply from server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full h-[600px] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-emerald-800 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-bold">Krishak AI Assistant</h3>
              <p className="text-xs text-emerald-200">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-slate-300 font-bold text-xl">&times;</button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user' 
                  ? 'bg-emerald-700 text-white rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <p className="text-xs text-slate-400 italic">Thinking...</p>}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            placeholder="Ask about crops, market prices, or your token..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-xl font-bold text-sm transition"
          >
            Send
          </button>
        </div>

      </div>
    </div>
  );
}