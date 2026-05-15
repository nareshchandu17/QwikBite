"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePageContext } from "@/hooks/usePageContext";

/* ---------------------------------------------
   Types
--------------------------------------------- */
interface Message {
  sender: "ai" | "user";
  text: string;
  buttons?: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
    variant?: "primary" | "secondary" | "danger";
  }>;
}

/* ---------------------------------------------
   Main Assistant Component
--------------------------------------------- */


const SUGGESTIONS = [
  "Track my current order",
  "What can I order right now?",
  "Show popular items and prices",
  "Find veg items under ₹80",
];

export default function qwikBiteAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { sender: "ai", text: "Ready to assist. What do you need?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const pageContext = usePageContext();

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC to close
  useEffect(() => {
    if (!open || !mounted) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, mounted]);

  async function handleSend(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((msgs) => [...msgs, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // Call AI assistant API
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          pageContext,
          userState: {
            cartItems: [],
            activeOrderId: undefined
          }
        })
      });

      if (!response.ok) {
        setLoading(false);
        const errorText = await response.text();
        let friendly = "I couldn't reach the assistant service right now. Please try again in a moment.";
        if (response.status === 401) friendly = "Please sign in to your account to use qwikBite Assistant.";

        await streamMessage(friendly);
        return;
      }

      const data = await response.json();
      setLoading(false);

      // Stream the AI response for a professional feel
      await streamMessage(data.message, data.buttons);

      // Handle UI directives after typing is done
      if (data.uiDirective) {
        handleUIDirective(data.uiDirective);
      }
    } catch (error) {
      setLoading(false);
      console.error("Assistant error:", error);
      await streamMessage("Service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
      // Auto-focus input after AI finishes
      inputRef.current?.focus();
    }
  }

  // Simulated streaming/typing effect
  const streamMessage = async (fullText: string, buttons?: any[]) => {
    setIsTyping(true);
    let currentText = "";
    
    // Create new AI message slot
    setMessages(prev => [...prev, { sender: "ai", text: "" }]);
    
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      setMessages(prev => {
        const last = [...prev];
        last[last.length - 1] = { ...last[last.length - 1], text: currentText };
        return last;
      });
      // Small delay per word for realistic feel
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
    }
    
    if (buttons) {
      setMessages(prev => {
        const last = [...prev];
        last[last.length - 1] = { ...last[last.length - 1], buttons };
        return last;
      });
    }
    setIsTyping(false);
  };

  // Helper function to handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  function handleUIDirective(directive: any) {
    switch (directive.action) {
      case "navigate":
        router.push(`/customer/${directive.target}`);
        break;
      case "refresh":
        window.location.reload();
        break;
      case "highlight":
        // Highlight element (would need implementation)
        break;
    }
  }

  async function handleButtonClick(action: string, params?: Record<string, any>) {
    if (action === "navigate" && params?.page) {
      router.push(`/customer/${params.page}`);
      return;
    }

    if (action === "add_to_cart" && params?.itemId) {
      // Trigger add to cart action
      setInput(`Add item ${params.itemId} to cart`);
      // Auto-submit
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
      return;
    }

    // For other actions, send as message
    setInput(action);
  }

  // Scroll to bottom on new message or during typing
  useEffect(() => {
    if (chatRef.current) {
      const scrollOptions: ScrollToOptions = {
        top: chatRef.current.scrollHeight,
        behavior: messages.length <= 2 ? 'auto' : 'smooth'
      };
      chatRef.current.scrollTo(scrollOptions);
    }
  }, [messages, isTyping, loading]);

  return (
    <>
      {mounted && (
        <>
          {/* Minimal Icon in Header */}
          <div className="fixed top-24 right-3 z-50 flex flex-col items-end">
            <div className="flex items-center gap-2 relative group">
              <button
                onClick={() => setOpen(true)}
                className="relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-[0_8px_30px_rgb(245,158,11,0.3)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden border border-white/20 group/btn"
                aria-label="Open qwikBite Assistant"
              >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                
                <Sparkles className="w-6 h-6 relative z-10 animate-[pulse_3s_infinite]" />
                
                {/* Status Dot with Ping */}
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              </button>
              {/* Tooltip */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                qwikBite Assistant
              </div>
            </div>
          </div>

          {/* Drawer / Bottom Sheet */}
          {open && (
            <aside
              className="fixed z-[9999] bg-white border-l border-gray-200 shadow-xl flex flex-col pointer-events-auto"
              style={{
                right: 0,
                top: window.innerWidth < 768 ? "auto" : "0",
                bottom: window.innerWidth < 768 ? 0 : "auto",
                height: window.innerWidth < 768 ? "60vh" : "100vh",
                width: window.innerWidth < 768 ? "100vw" : "24vw",
                minWidth: window.innerWidth < 768 ? undefined : 320,
                maxWidth: window.innerWidth < 768 ? undefined : 420,
                borderTopLeftRadius: window.innerWidth < 768 ? 24 : 0,
                borderTopRightRadius: window.innerWidth < 768 ? 24 : 0,
                borderBottomLeftRadius: window.innerWidth < 768 ? 0 : 24,
                borderBottomRightRadius: window.innerWidth < 768 ? 0 : 0,
                transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 0 24px 0 rgba(0,0,0,0.06)"
              }}
            >
          {/* Header */}
          <div className="flex items-center px-6 pt-6 pb-3 border-b border-gray-100 gap-2">
            <h2 className="font-serif font-black text-lg tracking-tighter text-[hsl(222.2_84%_4.9%)] flex-grow min-w-0 truncate">
              <span className="bg-gradient-to-r from-[hsl(24_85%_55%)] to-[hsl(35_100%_50%)] bg-clip-text text-transparent">
                Canteen
              </span>
              <span className="text-[hsl(222.2_84%_4.9%)] ml-1">Buddy Assistant</span>
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0 ml-2 cursor-pointer"
              aria-label="Close Assistant"
              style={{ pointerEvents: 'auto' }}
            >
              <span className="text-xl">×</span>
            </button>
          </div>

          {/* Intro Section */}
          <div className="px-6 pt-4 pb-2 text-gray-700 text-sm border-b border-gray-50">
            I can help you understand orders, availability, and next steps.
          </div>

          {/* Chat Messages */}
          <div 
            ref={chatRef}
            className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[200px] max-h-[300px]"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-amber-400 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  {message.buttons && (
                    <div className="mt-2 space-y-2">
                      {message.buttons.map((button, btnIndex) => (
                        <button
                          key={btnIndex}
                          onClick={() => handleButtonClick(button.action, button.params)}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            button.variant === 'primary'
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : button.variant === 'danger'
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(loading || isTyping) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex flex-col gap-2 px-6 py-4">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-200 transition-all duration-200 font-medium text-gray-900 shadow-sm hover:shadow-md text-sm"
                onClick={() => handleSuggestionClick(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Info Callout */}
          <div className="mx-6 mb-2 mt-1 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block w-4 h-4 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mr-1">i</span>
            I work based on your current screen and data.
            <a href="#" className="ml-auto text-amber-500 hover:underline">Learn more</a>
          </div>

          {/* Input Area */}
          <form
            id="qwikbite-form"
            className="mt-auto px-6 pb-6 pt-4 flex items-center gap-3 border-t border-gray-100"
            onSubmit={handleSend}
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition text-base shadow-sm hover:shadow-md"
                placeholder="Ask me anything about your order..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoFocus
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-amber-400 hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl px-4 py-3 font-semibold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center group"
              aria-label="Send message"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </button>
          </form>
        </aside>
          )}
        </>
      )}
      <style jsx global>{`
        .assistant-drawer-enter {
          transform: translateX(100%);
        }
        .assistant-drawer-enter-active {
          transform: translateX(0);
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </>
  );
}
