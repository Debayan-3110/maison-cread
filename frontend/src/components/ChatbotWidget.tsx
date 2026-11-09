import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  ShoppingBag,
  ShieldCheck,
  Lock,
  MapPin,
  Compass,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  Tag,
  ChevronRight,
  CheckCircle2,
  Phone,
  AlertTriangle,
  ExternalLink,
  User as UserIcon,
  Package
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatINR } from '../utils/commerce';
import { getStoredAccessToken } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  intent?: string;
  requiresAuth?: boolean;
  orderCard?: {
    id: string;
    status: string;
    assignedShopName: string;
    distanceKm: number;
    deliverySla: string;
    deliveryAddress: string;
    itemsCount: number;
  };
  personalCard?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    recentOrders?: any[];
  };
  recommendations?: any[];
  storeCards?: any[];
  action?: {
    type: string;
    [key: string]: any;
  };
  suggestedPrompts?: string[];
}

const DEFAULT_PROMPTS = [
  '📦 Track an Order (MC-ORD-...)',
  '🔒 My Account & Orders',
  '🌿 Perishables & Expiry Dates',
  '🏛️ Nearby Partner Ateliers',
  '🛡️ Open Box Delivery (OBD)',
  '🎁 20% Hope Angel Coupon'
];

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: "Greetings. I am the **Maison Cread AI Concierge**.\n\nI can assist you with real-time order tracking, catalog discovery, manufacturing and expiry dates, boutique routing, or accessing your private account vault.",
      sender: 'bot',
      suggestedPrompts: DEFAULT_PROMPTS
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    showToast,
    user,
    setIsAuthModalOpen,
    setAuthModalView,
    openOrderTracker,
    addToCart,
    setQuickViewProduct,
    applyCoupon
  } = useShop();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Execute chatbot query
  const handleSend = useCallback(async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: 'user'
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        throw new Error(`Concierge offline (HTTP ${response.status})`);
      }

      const data = await response.json();

      const botMsg: Message = {
        id: `bot-${Date.now() + 1}`,
        text: data.reply || "I am here to assist with your request.",
        sender: 'bot',
        intent: data.intent,
        requiresAuth: Boolean(data.requiresAuth),
        orderCard: data.orderCard,
        personalCard: data.personalCard,
        recommendations: data.recommendations,
        storeCards: data.storeCards,
        action: data.action,
        suggestedPrompts: data.suggestedPrompts || DEFAULT_PROMPTS
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('AI Concierge error:', err);
      const errorMsg: Message = {
        id: `err-${Date.now() + 1}`,
        text: "I encountered a minor network latency connecting to the sovereign intelligence gateway. Please retry your inquiry or select a quick option below.",
        sender: 'bot',
        suggestedPrompts: DEFAULT_PROMPTS
      };
      setMessages((prev) => [...prev, errorMsg]);
      showToast('AI Concierge Latency', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, showToast]);

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        text: "Greetings. I am the **Maison Cread AI Concierge**.\n\nConversation memory has been securely reset. How may I assist your connoisseur journey today?",
        sender: 'bot',
        suggestedPrompts: DEFAULT_PROMPTS
      }
    ]);
    showToast('Concierge conversation reset', 'info');
  };

  // Helper to render bold markdown, inline code, and clean paragraphs
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      // Check headings
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-serif font-bold text-xs uppercase tracking-wider text-accent mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }

      // Format bullets, bold, and code spans
      let content = line;
      const isBullet = content.trim().startsWith('•') || content.trim().startsWith('* ');
      if (isBullet) {
        content = content.replace(/^[\s•*]+/, '');
      }

      // Simple regex parser for **bold** and `code`
      const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

      return (
        <div key={idx} className={`leading-relaxed ${isBullet ? 'flex items-start gap-1.5 pl-1 my-0.5' : 'my-0.5'}`}>
          {isBullet && <span className="text-accent font-bold">•</span>}
          <span>
            {parts.map((p, pIdx) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-semibold text-body">
                    {p.slice(2, -2)}
                  </strong>
                );
              }
              if (p.startsWith('`') && p.endsWith('`')) {
                return (
                  <code key={pIdx} className="px-1.5 py-0.5 rounded bg-recess border border-hairline font-mono text-[11px] text-accent font-semibold">
                    {p.slice(1, -1)}
                  </code>
                );
              }
              return <span key={pIdx}>{p}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex flex-col items-stretch px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] phone-xl:bottom-6 phone-xl:right-6 phone-xl:left-auto phone-xl:items-end phone-xl:px-0 phone-xl:pb-0">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 25 }}
            className="pointer-events-auto mb-3 flex h-[min(65dvh,540px)] w-full max-w-full flex-col overflow-hidden border border-hairline card-premium shadow-2xl phone-lg:h-[min(72dvh,580px)] phone-xl:mb-4 phone-xl:w-96 sm:h-[620px] sm:w-[420px] rounded-3xl"
          >
            {/* Header: Cyber-Luxury Sovereign Persona */}
            <div className="p-4 bg-solid text-on-solid flex justify-between items-center shadow-md border-b border-hairline">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-solid animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-xs uppercase tracking-wider">Maison Concierge</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-accent text-[#16130E] font-bold">
                      AI OS
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-quiet opacity-90">
                    {user ? `Authenticated: ${user.fullName || user.email}` : 'Sovereign Client Airgap Active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset conversation memory"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-quiet hover:text-on-solid transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Concierge"
                  className="p-1.5 rounded-lg hover:bg-white/10 text-quiet hover:text-on-solid transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Suggested Prompt Chips Bar (Top Sticky) */}
            <div className="px-3 py-2 bg-recess/70 border-b border-hairline overflow-x-auto thin-scroll flex items-center gap-1.5 shrink-0">
              {DEFAULT_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10.5px] font-mono font-medium border border-hairline bg-panel hover:border-accent hover:text-accent text-quiet transition-all disabled:opacity-50 shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Stream */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 thin-scroll">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs ${
                        isUser
                          ? 'bg-solid text-on-solid rounded-tr-none shadow-sm'
                          : 'bg-recess text-body rounded-tl-none border border-hairline shadow-sm space-y-2.5'
                      }`}
                    >
                      {/* Message Body */}
                      <div className="text-xs">{renderFormattedText(msg.text)}</div>

                      {/* ========================================================= */}
                      {/* CARD 1: CRYPTOGRAPHIC AUTHENTICATION GATE (UNAUTHENTICATED) */}
                      {/* ========================================================= */}
                      {msg.requiresAuth && !user && (
                        <div className="mt-2.5 p-3.5 rounded-xl border border-accent/40 bg-accent/5 space-y-2.5">
                          <div className="flex items-center gap-2 text-accent">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span className="font-serif font-bold text-xs uppercase tracking-wide">
                              Sovereign Airgap Protection
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-quiet">
                            Personal acquisition manifests, saved addresses, and masked numbers are sealed. Authenticate to inspect your vault ledger.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthModalView('login');
                              setIsAuthModalOpen(true);
                            }}
                            className="w-full py-2 px-3 rounded-lg bg-accent text-[#16130E] font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Sign In with Google / Phone</span>
                          </button>
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* CARD 2: VERIFIED PERSONAL PROFILE (AUTHENTICATED)           */}
                      {/* ========================================================= */}
                      {msg.personalCard && (
                        <div className="mt-2.5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Verified Client Vault</span>
                            </span>
                            <span className="text-[10px] font-mono text-quiet">{msg.personalCard.email}</span>
                          </div>

                          <div className="space-y-1 text-[11px] font-mono">
                            <div className="font-bold text-body">{msg.personalCard.fullName}</div>
                            <div className="text-quiet flex items-center gap-1">
                              <Phone className="h-3 w-3 text-accent shrink-0" />
                              <span>{msg.personalCard.phone}</span>
                            </div>
                            <div className="text-quiet flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-accent shrink-0" />
                              <span className="truncate">{msg.personalCard.address}</span>
                            </div>
                          </div>

                          {/* Recent Orders List with Direct Track Action */}
                          {msg.personalCard.recentOrders && msg.personalCard.recentOrders.length > 0 && (
                            <div className="pt-2 border-t border-hairline space-y-1.5">
                              <span className="text-[10px] font-mono uppercase text-quiet block font-semibold">
                                Recent Sovereign Orders:
                              </span>
                              {msg.personalCard.recentOrders.slice(0, 3).map((ord) => (
                                <div
                                  key={ord.id}
                                  className="p-2 rounded-lg border border-hairline bg-canvas flex items-center justify-between text-[11px] font-mono"
                                >
                                  <div>
                                    <strong className="text-accent">{ord.id}</strong>
                                    <span className="text-quiet block text-[9.5px]">
                                      {ord.assigned_shop_name || 'Paris Atelier'} • {ord.tracking_stage || 'Confirmed'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => openOrderTracker(ord.id)}
                                    className="px-2 py-1 rounded bg-accent/15 text-accent border border-accent/30 hover:bg-accent hover:text-[#16130E] text-[10px] font-bold transition-colors flex items-center gap-1"
                                  >
                                    <Compass className="h-2.5 w-2.5" />
                                    <span>Track</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* CARD 3: REAL-TIME ORDER TRACKING CARD                       */}
                      {/* ========================================================= */}
                      {msg.orderCard && (
                        <div className="mt-2.5 p-3.5 rounded-xl border border-accent bg-accent/5 space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9.5px] font-mono uppercase bg-accent text-[#16130E] font-bold">
                              {msg.orderCard.id}
                            </span>
                            <span className="text-[10.5px] font-mono font-bold text-accent">
                              {msg.orderCard.distanceKm} km away
                            </span>
                          </div>

                          <div className="space-y-1 text-xs font-mono">
                            <div className="font-bold text-body">{msg.orderCard.assignedShopName}</div>
                            <div className="text-[11px] text-quiet">Protocol: <strong>{msg.orderCard.deliverySla}</strong></div>
                            <div className="text-[10.5px] text-quiet truncate">To: {msg.orderCard.deliveryAddress}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openOrderTracker(msg.orderCard?.id)}
                            className="w-full py-2 px-3 rounded-lg bg-accent text-[#16130E] font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Compass className="h-3.5 w-3.5" />
                            <span>Launch Live Sovereign Tracker</span>
                          </button>
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* CARD 4: GROUNDED PRODUCT RECOMMENDATIONS                    */}
                      {/* ========================================================= */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          <div className="text-[10.5px] font-mono uppercase text-quiet font-bold">
                            Curated Catalog Selections:
                          </div>
                          <div className="space-y-2">
                            {msg.recommendations.map((rec) => (
                              <div
                                key={rec.id}
                                className="p-2.5 rounded-xl border border-hairline bg-canvas hover:border-accent transition-colors space-y-2 shadow-quiet"
                              >
                                <div className="flex items-start gap-2.5">
                                  <img
                                    src={rec.thumbnail}
                                    alt={rec.title}
                                    className="h-12 w-12 rounded-lg object-contain bg-recess border border-hairline shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-body truncate text-xs">{rec.title}</h5>
                                    <div className="text-[10px] font-mono text-accent truncate">
                                      {rec.shopName || 'Maison Atelier'}
                                    </div>
                                    <div className="font-mono font-bold text-body text-xs mt-0.5">
                                      {formatINR(rec.price)}
                                    </div>
                                  </div>
                                </div>

                                {/* Freshness / Expiry / Batch Provenance Badge */}
                                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-hairline text-quiet">
                                  {rec.isPerishable ? (
                                    <span className="text-rose-500 font-semibold truncate">
                                      Exp: {rec.expiryDate} (Lot: {rec.batchNumber || 'BIO-01'})
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      Lifetime Provenance
                                    </span>
                                  )}
                                  <span>{rec.rating ? `${rec.rating} ★` : 'Maison Pick'}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addToCart(rec, 1);
                                      showToast(`Added ${rec.title} to bag`, 'success');
                                    }}
                                    className="flex-1 py-1 px-2 rounded-lg bg-solid text-on-solid hover:opacity-90 font-bold text-[10.5px] transition-opacity flex items-center justify-center gap-1"
                                  >
                                    <ShoppingBag className="h-3 w-3" />
                                    <span>Add to Bag</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuickViewProduct(rec)}
                                    className="py-1 px-2.5 rounded-lg border border-hairline hover:border-accent text-quiet hover:text-body text-[10.5px] font-semibold transition-colors flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Inspect</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* CARD 5: REGISTERED ATELIER / STORE CARDS                   */}
                      {/* ========================================================= */}
                      {msg.storeCards && msg.storeCards.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-quiet block font-bold">
                            Partner Ateliers & Coordinates:
                          </span>
                          {msg.storeCards.slice(0, 3).map((st, sIdx) => (
                            <div key={st.id || sIdx} className="p-2.5 rounded-xl border border-hairline bg-canvas space-y-1 text-xs font-mono">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-body truncate max-w-[200px]">{st.name}</span>
                                <span className="text-accent text-[10px] font-bold">{st.city || 'Flagship'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10.5px] text-quiet truncate">
                                <MapPin className="h-3 w-3 text-accent shrink-0" />
                                <span className="truncate">{st.address || st.location}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-quiet pt-1 border-t border-hairline">
                                <span>GPS: {st.latitude?.toFixed(2)}°, {st.longitude?.toFixed(2)}°</span>
                                <span>{st.phone || st.operating_hours || '10 AM - 8 PM'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* ========================================================= */}
                      {/* CARD 6: CHARITY / COUPON PROMOTION ACTION                   */}
                      {/* ========================================================= */}
                      {msg.action?.type === 'APPLY_COUPON' && (
                        <div className="mt-2.5 p-3 rounded-xl border border-accent/40 bg-accent/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-bold text-accent">Reward Code: HOPE-BLOOM-20</span>
                            <span className="px-2 py-0.5 rounded bg-accent text-[#16130E] font-bold text-[10px]">
                              20% OFF
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await applyCoupon('HOPE-BLOOM-20');
                            }}
                            className="w-full py-1.5 rounded-lg bg-accent text-[#16130E] font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <Tag className="h-3 w-3" />
                            <span>Apply 20% Discount to Bag</span>
                          </button>
                        </div>
                      )}

                      {/* Contextual Suggested Prompt Chips */}
                      {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && !isUser && (
                        <div className="pt-2 border-t border-hairline/60 flex flex-wrap gap-1">
                          {msg.suggestedPrompts.slice(0, 3).map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => handleSend(chip)}
                              className="px-2 py-0.5 rounded-md bg-panel border border-hairline hover:border-accent text-[10px] font-mono text-quiet hover:text-body transition-colors"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing Telemetry Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-recess text-quiet p-3 rounded-2xl rounded-tl-none text-xs border border-hairline flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="font-mono text-[11px]">Consulting Sovereign Vault Telemetry...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-panel border-t border-hairline flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about orders, expiry dates, or ateliers..."
                className="flex-grow bg-recess border border-hairline rounded-xl px-3.5 py-2 text-xs text-body placeholder:text-quiet focus:outline-none focus:border-accent font-sans transition-all"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-solid hover:opacity-90 text-on-solid rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Toggle Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Maison AI Concierge"
        className="pointer-events-auto self-end flex h-14 w-14 items-center justify-center rounded-2xl bg-solid text-on-solid shadow-2xl transition-all hover:opacity-90 phone-xl:self-auto border border-hairline group relative"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-on-solid" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6 text-on-solid group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent text-[8px] font-bold text-[#16130E] items-center justify-center">
                ✦
              </span>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ChatbotWidget;
