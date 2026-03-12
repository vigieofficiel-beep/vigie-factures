import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, ChevronDown, AlertCircle } from 'lucide-react';

const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  dark:   '#0F172A',
  mid:    '#1E293B',
  light:  '#94A3B8',
  border: '#E2E8F0',
  bg:     '#F8FAFC',
  red:    '#C75B4E',
};

const DISCLAIMER = "ℹ️ Ces informations sont indicatives et ne remplacent pas l'avis d'un expert-comptable.";

const SUGGESTIONS = [
  "Comment ajouter une dépense ?",
  "Quels sont les taux de TVA en France ?",
  "Comment enregistrer une facture client ?",
  "Où trouver mes contrats ?",
];

const SYSTEM_PROMPT = `Tu es Vigil, l'assistant intégré à Vigie Pro, une application de pré-comptabilité française.

TON RÔLE :
- Guider les utilisateurs dans la navigation de l'application Vigie Pro
- Répondre aux questions générales de comptabilité et fiscalité françaises
- Expliquer les concepts (TVA, charges, catégories de dépenses, etc.)
- Orienter vers les bonnes pages de l'application

PAGES DISPONIBLES DANS VIGIE PRO :
- /pro → Tableau de bord principal
- /pro/depenses → Gestion des dépenses et notes de frais
- /pro/recettes → Factures clients et recettes
- /pro/banque → Relevés bancaires et rapprochement
- /pro/contrats → Contrats et assurances
- /pro/formalites → Obligations légales et formalités
- /pro/mail-agent → Agent mail automatique
- /pro/equipe → Gestion de l'équipe
- /pro/pointages → Pointages et temps de travail
- /pro/fournisseurs → Factures fournisseurs
- /pro/exports → Export FEC et comptable

RÈGLES ABSOLUES :
1. Tu ne donnes JAMAIS de conseil personnalisé engageant une responsabilité juridique ou fiscale
2. Pour toute décision importante, tu recommandes toujours de consulter un expert-comptable
3. Tu restes dans le périmètre de la pré-comptabilité et de la navigation dans l'app
4. Tes réponses sont courtes, claires, en français
5. Tu n'inventes jamais de chiffres ou de règles fiscales — si tu n'es pas sûr, tu le dis
6. Tu es sympathique, professionnel, jamais condescendant

FORMAT :
- Réponses courtes (3-5 phrases max sauf si explication nécessaire)
- Utilise des listes à puces si tu listes plusieurs éléments
- Si la question concerne une page spécifique, indique le chemin (ex: "Rendez-vous dans Dépenses")`;

export default function Vigil() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis **Vigil**, votre assistant Vigie Pro 👋\n\nJe peux vous aider à naviguer dans l'application et répondre à vos questions de pré-comptabilité.\n\nComment puis-je vous aider ?",
      ts: Date.now(),
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef();
  const inputRef              = useRef();
  const navigate              = useNavigate();

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.map(m => ({ role: m.role, content: m.content }));

const response = await fetch('https://api.openai.com/v1/chat/completions', {        method: 'POST',
        headers: {
  'Content-Type': 'application/json',
'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,},
        body: JSON.stringify({
  model: 'gpt-4o-mini',
  max_tokens: 600,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ],
}),
      });

      const data = await response.json();
const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu répondre, réessayez.";

      // Détecte si la réponse contient une route navigable
      const routeMatch = reply.match(/\/pro\/[a-z\-]+/);

      const needsDisclaimer = /tva|charge|fiscal|impôt|cotisation|urssaf|bilan|comptab/i.test(userText);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply + (needsDisclaimer ? `\n\n*${DISCLAIMER}*` : ''),
        ts: Date.now(),
        route: routeMatch ? routeMatch[0] : null,
      }]);

      if (!open) setUnread(u => u + 1);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Une erreur est survenue. Veuillez réessayer.",
        ts: Date.now(),
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-size:11px;color:#94A3B8">$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/^- (.+)/gm, '<span style="display:block;padding-left:12px">• $1</span>');
  };

  return (
    <>
      {/* Bulle flottante */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>

        {/* Fenêtre chat */}
        {open && (
          <div style={{
            position: 'absolute', bottom: 68, right: 0,
            width: 360, height: 520,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.10)',
            border: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'vigilOpen 0.2s ease',
          }}>

            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg, ${C.dark} 0%, ${C.mid} 100%)`,
              padding: '16px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${C.blue}25`,
                  border: `1px solid ${C.blue}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={18} color={C.blue} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Vigil</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                    <span style={{ fontSize: 10, color: '#64748B' }}>Assistant Vigie Pro</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 8, padding: 6, cursor: 'pointer',
                color: '#64748B', display: 'flex',
              }}>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '14px 14px 4px',
              display: 'flex', flexDirection: 'column', gap: 10,
              scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '10px 13px',
                    borderRadius: msg.role === 'user'
                      ? '14px 14px 4px 14px'
                      : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? `linear-gradient(135deg, ${C.blue} 0%, #4a8fb5 100%)`
                      : C.bg,
                    border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                    fontSize: 12.5,
                    color: msg.role === 'user' ? '#fff' : C.dark,
                    lineHeight: 1.55,
                  }}
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />
                </div>
              ))}

              {/* Bouton navigation si route détectée */}
              {messages[messages.length - 1]?.route && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    onClick={() => { navigate(messages[messages.length - 1].route); setOpen(false); }}
                    style={{
                      fontSize: 11, fontWeight: 700, color: C.blue,
                      background: `${C.blue}12`, border: `1px solid ${C.blue}30`,
                      borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                    }}
                  >
                    → Aller à la page
                  </button>
                </div>
              )}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                    background: C.bg, border: `1px solid ${C.border}`,
                    display: 'flex', gap: 4, alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: C.light,
                        animation: `vigilDot 1.2s ease ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    fontSize: 11, color: C.blue,
                    background: `${C.blue}0f`, border: `1px solid ${C.blue}25`,
                    borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '10px 12px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 8, alignItems: 'flex-end',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question…"
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '9px 12px',
                  fontSize: 12.5, fontFamily: 'inherit',
                  color: C.dark, outline: 'none',
                  background: C.bg, lineHeight: 1.4,
                  maxHeight: 80, overflowY: 'auto',
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: input.trim() && !loading ? C.blue : C.border,
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s ease', flexShrink: 0,
                }}
              >
                <Send size={14} color={input.trim() && !loading ? '#fff' : C.light} />
              </button>
            </div>

          </div>
        )}

        {/* Bouton flottant */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 52, height: 52, borderRadius: 16,
            background: open
              ? C.mid
              : `linear-gradient(135deg, ${C.blue} 0%, #4a8fb5 100%)`,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(91,163,199,0.4)',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {open
            ? <X size={20} color="#fff" />
            : <MessageCircle size={22} color="#fff" />
          }
          {/* Badge non-lu */}
          {!open && unread > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: C.red, border: '2px solid #fff',
              fontSize: 9, fontWeight: 800, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{unread}</div>
          )}
        </button>
      </div>

      <style>{`
        @keyframes vigilOpen {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes vigilDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </>
  );
}
