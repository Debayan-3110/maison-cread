import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, ShoppingBag, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';
import { formatINR } from '../utils/commerce';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  recommendations?: any[];
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hi! I'm your AI shopping assistant. Looking for something specific?", sender: 'bot' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { showToast, processAIAction } = useShop();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('AI failed to respond');

      const data = await response.json();

      // Execute AI Action if present
      if (data.action) {
        processAIAction(data.action);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: 'bot',
        recommendations: data.recommendations
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a bit of trouble connecting to the catalog. Please try again in a moment!",
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMsg]);
      showToast('AI Connection Error', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-4 w-80 sm:w-96 h-[500px] card-premium shadow-scrim flex flex-col overflow-hidden border border-hairline"
          >
            {/* Header */}
            <div className="p-4 bg-solid text-on-solid flex justify-between items-center shadow-quiet">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-bold tracking-tight">AI Shopping Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-recess/20 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-solid text-on-solid rounded-tr-none'
                      : 'bg-recess text-body rounded-tl-none border border-hairline'
                  }`}>
                    <p>{msg.text}</p>

                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.recommendations.map((rec, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02, x: 4 }}
                            className="p-2 bg-panel rounded-lg border border-hairline flex items-center gap-3 group cursor-pointer shadow-quiet"
                          >
                            <div className="p-2 bg-accent-soft rounded-md text-accent">
                              <ShoppingBag size={16} />
                            </div>
                            <div className="flex-grow overflow-hidden">
                              <div className="text-xs font-bold truncate text-body">{rec.title}</div>
                              <div className="text-[10px] text-quiet truncate">{rec.reason}</div>
                            </div>
                            <div className="text-xs font-bold text-body">{formatINR(rec.price)}</div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-recess text-quiet p-3 rounded-2xl rounded-tl-none text-xs animate-pulse flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-quiet rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-quiet rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-quiet rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    AI is searching...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-panel border-t border-hairline flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for a recommendation..."
                className="flex-grow bg-recess border border-hairline rounded-full px-4 py-2 text-sm text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="p-2 bg-solid hover:opacity-90 text-on-solid rounded-full transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-solid text-on-solid rounded-full shadow-scrim flex items-center justify-center hover:opacity-90 transition-colors"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
