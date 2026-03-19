import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Copy, Check, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  [
    "Qual zona eleitoral está performando melhor?",
    "Quais horários têm mais acessos ao site?",
    "Onde devo investir em tráfego pago agora?",
    "Quantos formulários foram respondidos hoje?",
  ],
  [
    "Qual a taxa de conversão atual do site?",
    "Qual cidade gera mais engajamento?",
    "Compare as zonas 134ª e 127ª para mim",
    "Qual dispositivo nossos eleitores mais usam?",
  ],
  [
    "Resuma o desempenho da campanha esta semana",
    "Quais bairros precisam de mais atenção?",
    "Como melhorar a taxa de cliques no WhatsApp?",
    "Qual a penetração da campanha em Goiânia?",
  ],
];

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function SarelliChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestionsIdx, setSuggestionsIdx] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setSuggestionsIdx((prev) => (prev + 1) % SUGGESTED_QUESTIONS.length);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        const { data, error } = await supabase.functions.invoke("sarelli", {
          body: { message: text.trim(), history, currentRoute: location.pathname },
        });

        if (error) throw error;

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || "Desculpe, ocorreu um erro.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("Sarelli error:", err);
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Desculpe, não consegui processar sua pergunta. Tente novamente em alguns instantes.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, location.pathname]
  );

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestionsIdx(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Chat drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex w-full flex-col border-l border-white/[0.08] bg-background/95 backdrop-blur-xl md:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Fernanda Sarelli</h3>
                  <span className="text-[11px] text-muted-foreground">Assistente IA da campanha</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
                    title="Limpar conversa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-display text-xl font-bold text-foreground mb-2">Olá! Sou a Fernanda Sarelli</h4>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    Sua assistente inteligente para análise de dados e estratégia do Painel.
                  </p>
                </motion.div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("group flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary/20 text-foreground rounded-br-md"
                        : "bg-white/[0.05] text-foreground border border-white/[0.06] rounded-bl-md"
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-table:my-2 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border prose-td:border prose-th:border-white/10 prose-td:border-white/10 prose-strong:text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="absolute -bottom-2 right-2 rounded-md bg-card p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 border border-white/[0.08]"
                      title="Copiar"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <span className="px-1 text-[10px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
                  <div className="rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/[0.06] px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="px-5 pb-2">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sugestões</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS[suggestionsIdx].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/[0.08] p-4">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2 focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder="Pergunte à Sarelli..."
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
