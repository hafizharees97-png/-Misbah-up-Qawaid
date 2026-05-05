import React, { useState, useEffect } from 'react';
import { analyzeArabicTextStream, getApiKey } from './services/geminiService';
import { Search, Loader2, Languages, AlertCircle, Trash2, X, Clock, Menu, History as HistoryIcon } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface HistoryItem {
  id: string;
  text: string;
  analysis: string;
  language: string;
  timestamp: number;
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('Urdu');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const languageMap: Record<string, string> = {
    "Urdu": "اردو",
    "Arabic": "عربی",
    "English": "انگریزی",
    "Persian": "فارسی",
    "Turkish": "ترکی",
    "Hindi": "ہندی",
    "Bengali": "بنگالی",
    "Punjabi": "پنجابی",
    "Pashto": "پشتو",
    "Sindhi": "سندھی",
    "French": "فرانسیسی",
    "Spanish": "ہسپانوی",
    "German": "جرمن",
    "Russian": "روسی",
    "Chinese": "چینی",
    "Japanese": "جاپانی"
  };

  const worldLanguages = Object.keys(languageMap).sort();

  useEffect(() => {
    const savedHistory = localStorage.getItem('miftah_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('miftah_history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      if (!getApiKey()) {
        setError('ایپ کو فعال کرنے کی ضرورت ہے۔ براہ کرم ایڈمن سے رابطہ کریں۔');
        setIsLoading(false);
        return;
      }

      let fullAnalysis = "";
      const stream = analyzeArabicTextStream(inputText, language);
      
      for await (const chunk of stream) {
        fullAnalysis += chunk;
        setAnalysis(fullAnalysis);
      }
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        text: inputText,
        analysis: fullAnalysis,
        language: language,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خرابی پیش آئی');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.text);
    setAnalysis(item.analysis);
    setLanguage(item.language);
    setIsHistoryOpen(false);
    setIsMenuOpen(false);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#2c1810] text-[#f8f5f0] font-sans selection:bg-[#d4a373] selection:text-white">
      {/* Top Bar */}
      <div className="bg-[#2c1810] text-white p-4 shadow-xl border-b border-[#d4a373]/10 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6 text-[#d4a373]" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">مصباحُ القواعد</h1>
        </div>
        <div className="flex gap-2">
          {/* Clock icon removed as requested, now only in menu */}
        </div>
      </div>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 h-full w-[280px] bg-[#2c1810] z-[120] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10 text-white">
                <h2 className="text-2xl font-bold text-[#d4a373]">مینو</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => { setIsHistoryOpen(true); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-[#3d2b1f] text-[#f8f5f0] transition-colors rounded-xl font-bold"
                >
                  <HistoryIcon className="w-5 h-5 text-[#d4a373]" />
                  <span>تاریخ (History)</span>
                </button>
                <button 
                  onClick={() => { setIsLangModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-[#3d2b1f] text-[#f8f5f0] transition-colors rounded-xl font-bold"
                >
                  <Languages className="w-5 h-5 text-[#d4a373]" />
                  <span>زبان (Language)</span>
                </button>
                <button 
                  onClick={() => { setIsAboutOpen(true); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-[#3d2b1f] text-[#f8f5f0] transition-colors rounded-xl font-bold"
                >
                  <AlertCircle className="w-5 h-5 text-[#d4a373]" />
                  <span>ایپ کے بارے میں</span>
                </button>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10 text-white/40 text-[10px] text-center tracking-widest uppercase">
                Misbah Digital v1.5
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#2c1810] text-[#f8f5f0] w-full max-w-lg rounded-3xl shadow-2xl p-8 text-right border border-[#d4a373]/20"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-[#d4a373]">مصباحُ القواعد</h2>
                <button onClick={() => setIsAboutOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="text-white/40" /></button>
              </div>
              <div className="space-y-4 text-white/70 leading-relaxed">
                <p className="text-lg">عربی نحو و صرف کی تعلیم و تحقیق کے لیے ایک جدید پلیٹ فارم۔</p>
                <p>اس ایپ کے ذریعے آپ کسی بھی عربی عبارت کا مکمل نحوی تجزیہ، صرفی تراکیب اور اغلاط کی تصحیح کر سکتے ہیں۔</p>
                <div className="p-4 bg-white/5 rounded-2xl text-sm border-r-4 border-[#d4a373] text-[#d4a373]">
                  خادمِ علم و دین: مصباحُ القواعد
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isOnline && (
        <div className="bg-red-600 text-white py-2 text-center text-sm font-bold">
           آپ آف لائن ہیں۔ انٹرنیٹ آن کریں۔
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <section className="text-center mb-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-center mb-4">
              <div className="h-0.5 w-12 bg-[#d4a373] mt-10" />
              <div className="mx-4 text-[#d4a373] text-2xl">⚡</div>
              <div className="h-0.5 w-12 bg-[#d4a373] mt-10" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold urdu-title text-[#d4a373] drop-shadow-lg">
              عربی نحوی و صرفی تجزیہ
            </h2>
            
            <div className="flex flex-col items-center gap-3">
              <p className="text-[#a89078] text-xl md:text-2xl font-medium tracking-wide">
                عربی عبارات کی مکمل تحقیق اور اغلاط کی تصحیح
              </p>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#d4a373]/50 to-transparent" />
            </div>
          </motion.div>
        </section>

        {/* Input Area */}
        <div className="bg-white text-[#2c1810] rounded-3xl shadow-xl p-6 mb-8 border border-[#d4a373]/20">
          <form onSubmit={handleAnalyze}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="عربی عبارت یہاں لکھیں..."
              dir="rtl"
              className="w-full h-40 p-4 text-xl border-none outline-none resize-none text-right font-serif placeholder:text-gray-300 bg-white"
            />
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="text-sm font-bold text-[#d4a373]">
                تحقیق کی زبان: {languageMap[language] || language}
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className={cn(
                  "w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2",
                  isLoading || !inputText.trim() ? "bg-gray-200 text-gray-400" : "bg-[#d4a373] text-white hover:bg-[#bc8a5f]"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                تحقیق کریں
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Results Area */}
        {analysis || isLoading ? (
          <div className="bg-white text-[#2c1810] rounded-3xl shadow-xl overflow-hidden border border-[#d4a373]/20">
            <div className="bg-[#2c1810] text-[#d4a373] px-6 py-3 font-bold border-b border-[#d4a373]/30">
              تحقیقی رپورٹ
            </div>
            <div className="p-6 md:p-10 markdown-body" dir={language === 'English' ? 'ltr' : 'rtl'}>
              {analysis ? <Markdown>{analysis}</Markdown> : <div className="text-center py-10 text-gray-400">تجزیہ ہو رہا ہے...</div>}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white text-[#2c1810] rounded-3xl shadow-xl border border-[#d4a373]/20">
            <p className="text-[#a89078] text-lg">عربی عبارت درج کرکے 'تحقیق کریں' پر کلک کریں</p>
          </div>
        )}
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#2c1810] text-[#f8f5f0] w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] border border-[#d4a373]/20"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-[#d4a373]" />
                  تاریخ (History)
                </h2>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                {history.length === 0 ? <p className="text-center text-white/40 py-10">کوئی ریکارڈ نہیں</p> : 
                  history.map(item => (
                    <div key={item.id} className="relative group">
                      <button onClick={() => loadFromHistory(item)} className="w-full text-right p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#d4a373]/50 transition-all flex flex-col gap-1">
                        <span className="text-[10px] text-white/40 font-mono tracking-wider">{new Date(item.timestamp).toLocaleString()}</span>
                        <p className="font-serif truncate pr-6 text-lg">{item.text}</p>
                      </button>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#2c1810] text-[#f8f5f0] w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh] border border-[#d4a373]/20"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-bold text-[#d4a373] flex items-center gap-2">
                   <Languages className="w-6 h-6" />
                   زبان سلیکٹ کریں
                </h2>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
              </div>
              <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2 custom-scrollbar">
                {worldLanguages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setIsLangModalOpen(false); }}
                    className={cn(
                      "p-3 rounded-xl text-sm font-bold border-2 transition-all",
                      language === lang 
                        ? "bg-[#d4a373] text-[#2c1810] border-[#d4a373]" 
                        : "bg-white/5 border-white/10 text-white/70 hover:border-[#d4a373] hover:text-white"
                    )}
                  >
                    {languageMap[lang] || lang}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-10 text-center opacity-50 text-xs">
        © {new Date().getFullYear()} مصباحُ القواعد
      </footer>
    </div>
  );
}
