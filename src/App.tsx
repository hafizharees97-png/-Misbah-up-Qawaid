import React, { useState, useEffect } from 'react';
import { analyzeArabicText, analyzeArabicTextStream, translateUiLabels, getApiKey } from './services/geminiService';
import { Search, BookOpen, Loader2, Languages, Info, AlertCircle, History, Trash2, X, Clock, Menu } from 'lucide-react';
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
  const [uiLanguage, setUiLanguage] = useState<string>('Urdu');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, any>>({});
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

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('miftah_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('miftah_history', JSON.stringify(history));
  }, [history]);

  // Dynamic UI Translation
  useEffect(() => {
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
    const translate = async () => {
      if (uiLabels[uiLanguage]) return; // Already have it
      if (dynamicLabels[uiLanguage]) return; // Already translated

      // Don't translate if we have no key
      // if (!getApiKey()) return;

      setIsTranslating(true);
      try {
        const translated = await translateUiLabels(uiLanguage);
        if (translated) {
          setDynamicLabels(prev => ({ ...prev, [uiLanguage]: translated }));
        }
      } catch (err) {
        console.error("Translation failed", err);
      } finally {
        setIsTranslating(false);
      }
    };
    translate();
  }, [uiLanguage]);


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
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm('کیا آپ تمام ہسٹری ختم کرنا چاہتے ہیں؟')) {
      setHistory([]);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setInputText(item.text);
    setAnalysis(item.analysis);
    setLanguage(item.language as any);
    setIsHistoryOpen(false);
  };

  const uiLabels: Record<string, any> = {
    Urdu: {
      subtitle: 'اہلسنت والجماعت (حنفی، ماتریدی، بریلوی) کے علمی ذوق کے مطابق عربی عبارات کی مکمل تحقیق اور اغلاط کی تصحیح',
      placeholder: 'عربی عبارت یہاں لکھیں...',
      button: 'تحقیق کریں',
      loading: 'تجزیہ ہو رہا ہے...',
      report: 'تحقیقی رپورٹ',
      context: 'حنفی، ماتریدی، بریلوی نقطہ نظر',
      empty: 'کوئی بھی عربی عبارت درج کریں تاکہ اس کی نحوی و صرفی تحقیق پیش کی جا سکے',
      wait: 'علمی تحقیق جاری ہے، براہ کرم انتظار کریں...',
      footer: 'خادمِ علم و دین: مفتی اہلسنت والجماعت',
      menu: 'مینو',
      history: 'تاریخ (History)',
      language: 'زبان (Language)',
      sysLang: 'سسٹم کی زبان',
      anaLang: 'تحقیق کی زبان',
      close: 'بند کریں',
      clear: 'ہسٹری ختم کریں',
      noHistory: 'ابھی تک کوئی ہسٹری موجود نہیں ہے'
    },
    English: {
      subtitle: 'Comprehensive research and error correction of Arabic texts according to the Ahl-e-Sunnat (Hanafi, Maturidi, Barelvi) perspective',
      placeholder: 'Enter Arabic text here...',
      button: 'Analyze',
      loading: 'Analyzing...',
      report: 'Research Report',
      context: 'Hanafi, Maturidi, Barelvi Perspective',
      empty: 'Enter any Arabic text to see its Nahw and Sarf analysis',
      wait: 'Scientific research in progress, please wait...',
      footer: 'Servant of Knowledge & Religion: Mufti of Ahl-e-Sunnat',
      menu: 'Menu',
      history: 'History',
      language: 'Language',
      sysLang: 'System Language',
      anaLang: 'Analysis Language',
      close: 'Close',
      clear: 'Clear History',
      noHistory: 'No history available yet'
    },
    Arabic: {
      subtitle: 'بحث شامل وتصحيح الأخطاء للنصوص العربية وفق منظور أهل السنة والجماعة (حنفي، ماتريدي، بريلوي)',
      placeholder: 'أدخل النص العربي هنا...',
      button: 'تحليل',
      loading: 'جاري التحليل...',
      report: 'تقرير البحث',
      context: 'منظور الحنفي، الماتريدي، البريلوي',
      empty: 'أدخل أي نص عربي لرؤية تحليله النحوي والصرفي',
      wait: 'البحث العلمي جارٍ، يرجى الانتظار...',
      footer: 'خادم العلم والدين: مفتي أهل السنة والجماعة',
      menu: 'القائمة',
      history: 'السجل',
      language: 'اللغة',
      sysLang: 'لغة النظام',
      anaLang: 'لغة التحقيق',
      close: 'إغلاق',
      clear: 'مسح السجل',
      noHistory: 'لا يوجد سجل متاح بعد'
    },
    Persian: {
      subtitle: 'تحقیق جامع و اصلاح خطاهای متون عربی بر اساس دیدگاه اهل سنت (حنفی، ماتریدی، بریلوی)',
      placeholder: 'متن عربی را اینجا وارد کنید...',
      button: 'تجزیه و تحلیل',
      loading: 'در حال تجزیه و تحلیل...',
      report: 'گزارش تحقیق',
      context: 'دیدگاه حنفی، ماتریدی، بریلوی',
      empty: 'هر متن عربی را وارد کنید تا تجزیه و تحلیل نحو و صرف آن را ببینید',
      wait: 'تحقیق علمی در حال انجام است، لطفا منتظر بمانید...',
      footer: 'خادم علم و دین: مفتی اهل سنت و جماعت',
      menu: 'منو',
      history: 'تاریخچه',
      language: 'زبان',
      sysLang: 'زبان سیستم',
      anaLang: 'زبان تحقیق',
      close: 'بستن',
      clear: 'پاک کردن تاریخچه',
      noHistory: 'هنوز تاریخچه‌ای در دسترس نیست'
    },
    Turkish: {
      subtitle: 'Ehl-i Sünnet (Hanefi, Maturidi, Barelevi) perspektifine göre Arapça metinlerin kapsamlı araştırması ve hata düzeltmesi',
      placeholder: 'Arapça metni buraya girin...',
      button: 'Analiz Et',
      loading: 'Analiz ediliyor...',
      report: 'Araştırma Raporu',
      context: 'Hanefi, Maturidi, Barelevi Perspektifi',
      empty: 'Nahiv ve Sarf analizini görmek için herhangi bir Arapça metin girin',
      wait: 'Bilimsel araştırma devam ediyor, lütfen bekleyin...',
      footer: 'İlim ve Din Hizmetkarı: Ehl-i Sünnet Müftüsü',
      menu: 'Menü',
      history: 'Geçmiş',
      language: 'Dil',
      sysLang: 'Sistem Dili',
      anaLang: 'Araştırma Dili',
      close: 'Kapat',
      clear: 'Geçmişi Temizle',
      noHistory: 'Henüz geçmiş yok'
    }
  };

  const labels = uiLabels[uiLanguage] || dynamicLabels[uiLanguage] || uiLabels.Urdu;
  
  const systemLangLabels = {
    Urdu: 'سسٹم کی زبان',
    English: 'System Language',
    Arabic: 'لغة النظام'
  };

  const analysisLangLabels = {
    Urdu: 'تحقیق کی زبان',
    English: 'Analysis Language',
    Arabic: 'لغة التحقيق'
  };

  return (
    <div className="min-h-screen text-[#2c1810] font-sans selection:bg-[#d4a373] selection:text-white relative">
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 text-center z-[100] flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <AlertCircle className="w-4 h-4" />
            <span>آپ اس وقت آف لائن ہیں۔ تحقیق کے لیے انٹرنیٹ ضروری ہے۔</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Buttons */}
      <div className="fixed top-6 left-6 z-50 flex flex-row-reverse gap-3 items-center">
        {/* Menu Button (Hamburger) */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3 bg-[#2c1810] text-[#d4a373] rounded-full shadow-xl border border-[#d4a373]/30 hover:bg-[#3d2b1f] transition-all"
            title={labels.menu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                className="absolute top-full left-0 mt-3 w-48 bg-[#2c1810] border border-[#d4a373]/30 rounded-2xl shadow-2xl overflow-hidden"
              >
                <button 
                  onClick={() => { setIsHistoryOpen(true); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 text-left flex items-center gap-3 hover:bg-[#3d2b1f] text-[#f8f5f0] transition-colors border-b border-[#d4a373]/10"
                >
                  <Clock className="w-4 h-4 text-[#d4a373]" />
                  <span>{labels.history}</span>
                </button>
                <button 
                  onClick={() => { setIsLangModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full px-6 py-4 text-left flex items-center gap-3 hover:bg-[#3d2b1f] text-[#f8f5f0] transition-colors"
                >
                  <Languages className="w-4 h-4 text-[#d4a373]" />
                  <span>{labels.language}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Background Pattern Overlay */}
      <div className="fixed inset-0 islamic-pattern pointer-events-none z-0" />
      
      {/* Header */}
      <header className="relative bg-[#2c1810] text-[#f8f5f0] overflow-hidden border-b-4 border-[#d4a373] shadow-2xl z-10">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#d4a373 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#d4a373]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#d4a373]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="text-center lg:text-right flex-1">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col md:flex-row items-center justify-center lg:justify-end gap-5 mb-6"
              >
                <div className="p-4 bg-[#3d2b1f] rounded-3xl border-2 border-[#d4a373]/40 shadow-[0_0_20px_rgba(212,163,115,0.2)] transform hover:rotate-6 transition-transform duration-300">
                  <BookOpen className="w-12 h-12 text-[#d4a373]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-2 drop-shadow-md flex items-center justify-center lg:justify-end gap-3">
                    مصباحُ القواعد
                  </h1>
                  <div className="h-1 w-32 bg-[#d4a373] mx-auto lg:mr-0 lg:ml-auto rounded-full"></div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl text-[#d4a373] font-medium mb-4 font-serif">عربی نحوی و صرفی تجزیہ</h2>
                <p className="text-[#a89078] text-base md:text-lg max-w-2xl mx-auto lg:mr-0 lg:ml-auto leading-relaxed opacity-90">
                  {labels.subtitle}
                </p>
              </motion.div>
            </div>
            
            {/* Analysis Language Selector (Simple version removed in favor of the new modal) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              className="bg-[#3d2b1f]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-[#d4a373]/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col gap-4"
            >
              <div className="text-center">
                <h3 className="text-[#d4a373] font-bold text-lg mb-1">{labels.anaLang}</h3>
                <p className="text-[#a89078] text-xs">{languageMap[language] || language}</p>
              </div>
              <button 
                onClick={() => setIsLangModalOpen(true)}
                className="px-6 py-3 bg-[#d4a373] text-white rounded-xl font-bold hover:bg-[#bc8a5f] transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Languages className="w-4 h-4" />
                {labels.language}
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Decorative Bismillah/Divider */}
        <div className="text-center mb-10">
          <div className="inline-block px-6 py-2 border-y-2 border-[#d4a373]/30 text-[#d4a373] font-serif text-2xl">
            ﷽
          </div>
        </div>

        {/* Input Section */}
        <section className="mb-12 relative z-10">
          <div className="manuscript-frame rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleAnalyze} className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="عربی عبارت یہاں لکھیں..."
                dir="rtl"
                className="w-full h-48 p-8 text-2xl bg-white border-none focus:ring-0 transition-all outline-none resize-none text-right font-serif placeholder:text-[#a89078]/50"
              />
              <div className="absolute bottom-6 left-6 flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className={cn(
                    "flex items-center gap-2 px-10 py-4 rounded-xl font-bold transition-all shadow-xl border-b-4",
                    isLoading || !inputText.trim() 
                      ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed" 
                      : "bg-[#d4a373] text-white border-[#bc8a5f] hover:bg-[#bc8a5f] active:scale-95 active:border-b-0 active:translate-y-1"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {labels.loading}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      {labels.button}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Status Messages - Only show during active error */}
        <AnimatePresence>
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-10 p-6 bg-red-50 border-2 border-red-200 text-red-800 rounded-3xl flex flex-col items-center gap-4 text-center shadow-lg"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="font-bold text-lg">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <section>
          <AnimatePresence mode="wait">
            {isLoading && !analysis ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-[#a89078]"
              >
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-[#d4a373]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#d4a373] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-lg font-medium animate-pulse">{labels.wait}</p>
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="manuscript-frame rounded-3xl shadow-2xl overflow-hidden relative z-10"
              >
                <div className="bg-[#fdfbf7] border-b-2 border-[#d4a373]/30 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#d4a373]">
                    <Languages className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider text-sm">{labels.report}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#a89078]">
                    <Info className="w-4 h-4" />
                    <span>{labels.context}</span>
                  </div>
                </div>
                <div 
                  className="p-8 md:p-12 markdown-body max-w-none" 
                  dir={language === 'English' ? 'ltr' : 'rtl'}
                >
                  <Markdown>{analysis}</Markdown>
                </div>
                {isLoading && (
                  <div className="px-8 pb-4 flex justify-end">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#d4a373] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-[#d4a373] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-[#d4a373] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 border-2 border-dashed border-[#e0d5c1] rounded-3xl"
              >
                <BookOpen className="w-12 h-12 text-[#e0d5c1] mx-auto mb-4" />
                <p className="text-[#a89078] max-w-xs mx-auto">
                  {labels.empty}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-16 bg-[#2c1810] text-[#a89078] text-center border-t-4 border-[#d4a373] relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6 flex justify-center gap-4 opacity-30">
            <div className="w-12 h-0.5 bg-[#d4a373]" />
            <div className="w-2 h-2 rounded-full bg-[#d4a373]" />
            <div className="w-12 h-0.5 bg-[#d4a373]" />
          </div>
          <p className="mb-2 font-bold text-[#f8f5f0] tracking-wide">{labels.footer}</p>
          <p className="text-xs opacity-60">© {new Date().getFullYear()} مصباحُ القواعد - تمام حقوق محفوظ ہیں</p>
        </div>
      </footer>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#f8f5f0] w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#e0d5c1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 text-[#2c1810]">
                  <History className="w-6 h-6 text-[#d4a373]" />
                  <h2 className="text-xl font-bold">{labels.history}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                      <Trash2 className="w-4 h-4" />
                      {labels.clear}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-[#a89078]">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{labels.noHistory}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-white border border-[#e0d5c1] p-4 rounded-2xl hover:border-[#d4a373] transition-all group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] text-[#a89078] font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                          <button 
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-lg font-serif mb-3 line-clamp-2" dir="rtl">{item.text}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-[#f8f5f0] px-2 py-1 rounded-md text-[#d4a373] font-bold">
                            {languageMap[item.language] || item.language}
                          </span>
                          <button 
                            onClick={() => loadFromHistory(item)}
                            className="text-sm font-bold text-[#d4a373] hover:text-[#bc8a5f]"
                          >
                            دوبارہ دیکھیں
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#f8f5f0] w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#e0d5c1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 text-[#2c1810]">
                  <Languages className="w-6 h-6 text-[#d4a373]" />
                  <h2 className="text-xl font-bold">{labels.language}</h2>
                </div>
                <button 
                  onClick={() => setIsLangModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                {/* System Language Section */}
                <div className="mb-10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#d4a373] rounded-full"></div>
                    {labels.sysLang}
                    {isTranslating && <Loader2 className="w-4 h-4 animate-spin text-[#d4a373]" />}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {worldLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setUiLanguage(lang);
                          // Don't close immediately if it's a dynamic language to show loading
                          if (uiLabels[lang]) setIsLangModalOpen(false);
                        }}
                        className={cn(
                          "p-4 rounded-2xl font-bold transition-all border-2 text-sm",
                          uiLanguage === lang 
                            ? "bg-[#d4a373] text-white border-[#d4a373] shadow-lg" 
                            : "bg-white border-[#e0d5c1] text-[#a89078] hover:border-[#d4a373]"
                        )}
                      >
                        {languageMap[lang] || lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Language Section */}
                <div>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#bc8a5f] rounded-full"></div>
                    {labels.anaLang}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {worldLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setIsLangModalOpen(false);
                        }}
                        className={cn(
                          "p-4 rounded-2xl font-bold transition-all border-2 text-sm",
                          language === lang 
                            ? "bg-[#bc8a5f] text-white border-[#bc8a5f] shadow-lg" 
                            : "bg-white border-[#e0d5c1] text-[#a89078] hover:border-[#bc8a5f]"
                        )}
                      >
                        {languageMap[lang] || lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
