import React, { useMemo, useState } from 'react';
import { MessageCircle, Send, X, BookOpen } from 'lucide-react';
import { useSanstha } from '../context/SansthaContext';
import { GUIDE_ENTRIES, matchGuideEntries } from '../experience/knowledge';

export const SansthaGuide: React.FC = () => {
  const { lang, currentRoute } = useSanstha();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [source, setSource] = useState<'knowledge' | 'model' | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => GUIDE_ENTRIES.slice(0, 4), []);

  if (currentRoute === 'admin') return null;

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question) return;
    setLoading(true);
    setReply(null);
    try {
      const response = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, lang }),
      });
      if (response.ok) {
        const data = await response.json();
        setReply(data.answer);
        setSource(data.source === 'model' ? 'model' : 'knowledge');
        return;
      }
    } catch {
      // Fall through to local knowledge.
    } finally {
      setLoading(false);
    }
    const match = matchGuideEntries(question, 1)[0];
    setReply(lang === 'mr' ? match.answerMr : match.answerEn);
    setSource('knowledge');
  };

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-40">
      {open && (
        <div className="mb-3 w-[min(92vw,380px)] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-[#071D43] text-white flex items-center justify-between">
            <div>
              <p className="text-sm font-serif font-bold">{lang === 'mr' ? 'संस्था मार्गदर्शक' : 'Sanstha Guide'}</p>
              <p className="text-[11px] text-white/70">
                {lang === 'mr'
                  ? 'संस्थेच्या अधिकृत माहितीवर आधारित उत्तरे'
                  : 'Answers grounded in verified organisational information'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Close guide">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQuery(lang === 'mr' ? item.questionMr : item.questionEn);
                    void ask(lang === 'mr' ? item.questionMr : item.questionEn);
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  {lang === 'mr' ? item.questionMr : item.questionEn}
                </button>
              ))}
            </div>
            {loading && <p className="text-xs text-slate-500">{lang === 'mr' ? 'उत्तर तयार करत आहे...' : 'Preparing an answer...'}</p>}
            {reply && (
              <div className="rounded-2xl bg-[#F8FBFE] border border-slate-200 p-3 text-sm text-slate-700 leading-relaxed">
                <p>{reply}</p>
                <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {source === 'model'
                    ? lang === 'mr'
                      ? 'मॉडेल + संस्थेची अधिकृत माहिती'
                      : 'Model + verified Sanstha information'
                    : lang === 'mr'
                    ? 'स्थानिक ज्ञानसंग्रह'
                    : 'Local knowledge base'}
                </p>
              </div>
            )}
          </div>
          <form
            className="p-3 border-t border-slate-100 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(query);
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
              placeholder={lang === 'mr' ? 'प्रश्न विचारा...' : 'Ask a question...'}
              aria-label={lang === 'mr' ? 'मार्गदर्शक प्रश्न' : 'Guide question'}
            />
            <button type="submit" className="p-2 rounded-xl bg-[#0868C9] text-white cursor-pointer" aria-label="Send">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#071D43] text-white shadow-2xl cursor-pointer"
        aria-expanded={open}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-semibold hidden sm:inline">{lang === 'mr' ? 'मार्गदर्शक' : 'Guide'}</span>
      </button>
    </div>
  );
};
