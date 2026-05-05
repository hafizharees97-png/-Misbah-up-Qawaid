import React, { useState, useEffect } from 'react';
import { analyzeArabicTextStream, getApiKey } from './services/geminiService';
import { Search, Loader2, Languages, AlertCircle, History, Trash2, X, Clock, Menu } from 'lucide-react';
import Markdown from 'react-markdown';
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
    "Japanese": "جاپانی",
    "Korean": "کوریائی",
    "Indonesian": "انڈونیشیائی",
    "Malay": "ملائی",
    "Portuguese": "پرتگالی",
    "Italian": "اطالوی",
    "Dutch": "ڈچ",
    "Greek": "یونانی",
    "Hebrew": "عبرانی",
    "Thai": "تھائی",
    "Vietnamese": "ویتنامی",
    "Tamil": "تامل",
    "Telugu": "تیلگو",
    "Marathi": "مراٹھی",
    "Gujarati": "گجراتی",
    "Kannada": "کنڑ",
    "Malayalam": "ملیالم",
    "Hausa": "ہوسا",
    "Swahili": "سواحلی",
    "Amharic": "امہاری",
    "Oromo": "اورومو",
    "Somali": "صومالی",
    "Yoruba": "یوروبا",
    "Igbo": "اگبو",
    "Zulu": "زولو",
    "Xhosa": "ایکسہوسا",
    "Afrikaans": "افریقی",
    "Polish": "پولش",
    "Ukrainian": "یوکرینی",
    "Romanian": "رومانیائی",
    "Hungarian": "ہنگری",
    "Czech": "چیک",
    "Swedish": "سویڈش",
    "Norwegian": "نارویجن",
    "Danish": "دانش",
    "Finnish": "فننش"
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
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] text-[#2c1810] font-sans selection:bg-[#d4a373] selection:text-white">
      {/* Top Bar */}
      <div className="bg-[#2c1810] text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Menu className="w-6 h-6 text-[#d4a373]" />
          <h1 className="text-xl font-bold">مصباحُ القواعد</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="تاریخ">
            <Clock className="w-6 h-6 text-[#d4a373]" />
          </button>
          <button onClick={() => setIsLangModalOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="زبان">
            <Languages className="w-6 h-6 text-[#d4a373]" />
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-red-600 text-white py-2 text-center text-sm font-bold">
           آپ آف لائن ہیں۔ انٹرنیٹ آن کریں۔
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">عربی نحوی و صرفی تجزیہ</h2>
          <p className="text-[#a89078]">عربی عبارات کی مکمل تحقیق اور اغلاط کی تصحیح</p>
        </section>

        {/* Input Area */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-[#d4a373]/20">
          <form onSubmit={handleAnalyze}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="عربی عبارت یہاں لکھیں..."
              dir="rtl"
              className="w-full h-40 p-4 text-xl border-none outline-none resize-none text-right font-serif placeholder:text-gray-300"
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
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#d4a373]/20">
            <div className="bg-[#2c1810] text-[#d4a373] px-6 py-3 font-bold border-b border-[#d4a373]/30">
              تحقیقی رپورٹ
            </div>
            <div className="p-6 md:p-10 markdown-body" dir={language === 'English' ? 'ltr' : 'rtl'}>
              {analysis ? <Markdown>{analysis}</Markdown> : <div className="text-center py-10 text-gray-400">تجزیہ ہو رہا ہے...</div>}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-[#d4a373]/20">
            <p className="text-[#a89078]">عربی عبارت درج کرکے 'تحقیق کریں' پر کلک کریں</p>
          </div>
        )}
      </main>

      {/* History Overlay */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#d4a373]" />
                تاریخ (History)
              </h2>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-20 text-gray-400">کوئی ہسٹری نہیں</div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="relative group">
                    <button 
                      onClick={() => loadFromHistory(item)} 
                      className="w-full text-right p-4 border rounded-xl hover:bg-gray-50 hover:border-[#d4a373] transition-all flex flex-col gap-1"
                    >
                      <span className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleString()}</span>
                      <p className="font-serif truncate text-lg pr-8">{item.text}</p>
                      <span className="text-xs text-[#d4a373] font-bold">{languageMap[item.language] || item.language}</span>
                    </button>
                    <button 
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {history.length > 0 && (
              <div className="p-4 border-t">
                <button 
                  onClick={() => { if(window.confirm('ہسٹری ختم کریں؟')) setHistory([]); }}
                  className="w-full py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
                >
                  ہسٹری صاف کریں
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Language Overlay */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-[#d4a373] flex items-center gap-2">
                <Languages className="w-6 h-6" />
                زبان سلیکٹ کریں
              </h2>
              <button 
                onClick={() => setIsLangModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2">
              {worldLanguages.map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setIsLangModalOpen(false); }}
                  className={cn(
                    "p-3 rounded-xl text-sm font-bold border-2 transition-all",
                    language === lang ? "bg-[#d4a373] text-white border-[#d4a373]" : "bg-gray-50 border-gray-100 hover:border-[#d4a373]"
                  )}
                >
                  {languageMap[lang] || lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-center opacity-50 text-xs">
        <p className="mb-2">خادمِ علم و دین: مصباحُ القواعد</p>
        <p>© {new Date().getFullYear()} تمام حقوق محفوظ ہیں</p>
      </footer>
    </div>
  );
}
