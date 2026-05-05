import { GoogleGenAI } from "@google/genai";

// Helper to get the API key in different environments
export const getApiKey = () => {
  // Hardcoded key provided by user for universal activation
  const universalKey = "AIzaSyAvCKNkMrs438qHZ9owxgfK5FBQj4_g16U";
  
  // 1. Check local storage first (user provided via Settings)
  const storedKey = typeof window !== "undefined" ? localStorage.getItem('miftah_api_key') : null;
  if (storedKey && storedKey !== "undefined" && storedKey !== "null") return storedKey;

  // 2. Use universalKey as a strong default
  if (universalKey) return universalKey;

  // 3. Fallback to env vars if needed
  let key = (import.meta as any).env.VITE_GEMINI_API_KEY;
  
  // Fallback to process.env (for platform injection)
  if (!key && typeof process !== "undefined" && process.env) {
    key = process.env.GEMINI_API_KEY;
  }
  
  // Clean up potential "undefined" or "null" strings from builder substitutions
  if (!key || key === "undefined" || key === "null") return "";
  return key;
};

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = getApiKey();
    if (!apiKey) {
      // In mobile app wrappers, the environment variable might be literally the string "undefined"
      throw new Error("ایپ کو فعال کرنے کی ضرورت ہے۔ براہ کرم سیٹنگز (Gear Icon) میں اپنی اے پی آئی کی درج کریں۔");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export async function* analyzeArabicTextStream(text: string, language: string = "Urdu") {
  const prompt = `
    You are an expert in Arabic Grammar (Nahw) and Morphology (Sarf), specifically following the traditions of the Hanafi school (Fiqh), Maturidi (Aqeedah), and the Barelvi (Ahl-e-Sunnat) perspective.
    
    Analyze the following Arabic text in extreme detail (مکمل تفصیل کے ساتھ):
    "${text}"
    
    Provide the analysis strictly in ${language}. 
    
    The analysis must include:
    1. **Sarf Analysis (صرفی تحقیق):** Comprehensive breakdown of every single word. Mention Root Letters (مادہ), Scale (وزن), Type (اسم/فعل/حرف), and specific sub-types (e.g., Ism-e-Fa'il, Thulathi Mujarrad/Mazeed Feeh, etc.).
    2. **Nahw Analysis (نحوی ترکیب):** Detailed syntactic relationship between all words. Identify Mubtada (مبتدا), Khabar (خبر), Fa'il (فاعل), Maf'ul (مفعول), Mudaf (مضاف), Sifat (صفت), etc. Explain the grammatical state (I'rab) of each word.
    3. **Translation (ترجمہ):** A precise and respectful translation in ${language}.
    4. **Theological/Jurisprudential Context (علمی و فقہی فوائد):** If the text is from the Quran, Hadith, or a classical text, provide a brief explanation according to the Hanafi/Maturidi/Barelvi viewpoint.
    
    Format the output using clear Markdown headings, bold text for emphasis, and bullet points. Use professional, scholarly, and respectful language (علمی اور باوقار انداز).
    If the language is Urdu or Arabic, use RTL formatting and ensure the terminology is accurate to the Dars-e-Nizami curriculum.
  `;

  try {
    const ai = getAiClient();
    const stream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error streaming analysis:", error);
    throw error;
  }
}

export async function analyzeArabicText(text: string, language: string = "Urdu") {
  const prompt = `
    You are an expert in Arabic Grammar (Nahw) and Morphology (Sarf), specifically following the traditions of the Hanafi school (Fiqh), Maturidi (Aqeedah), and the Barelvi (Ahl-e-Sunnat) perspective.

    Analyze the following Arabic text in extreme detail (مکمل تفصیل کے ساتھ):
    "${text}"
    
    Provide the analysis strictly in ${language}. 
    
    The analysis must include:
    1. **Sarf Analysis (صرفی تحقیق):** Comprehensive breakdown of every single word. Mention Root Letters (مادہ), Scale (وزن), Type (اسم/فعل/حرف), and specific sub-types (e.g., Ism-e-Fa'il, Thulathi Mujarrad/Mazeed Feeh, etc.).
    2. **Nahw Analysis (نحوی ترکیب):** Detailed syntactic relationship between all words. Identify Mubtada (مبتدا), Khabar (خبر), Fa'il (فاعل), Maf'ul (مفعول), Mudaf (مضاف), Sifat (صفت), etc. Explain the grammatical state (I'rab) of each word.
    3. **Translation (ترجمہ):** A precise and respectful translation in ${language}.
    4. **Theological/Jurisprudential Context (علمی و فقہی فوائد):** If the text is from the Quran, Hadith, or a classical text, provide a brief explanation according to the Hanafi/Maturidi/Barelvi viewpoint.
    
    Format the output using clear Markdown headings, bold text for emphasis, and bullet points. Use professional, scholarly, and respectful language (علمی اور باوقار انداز).
    If the language is Urdu or Arabic, use RTL formatting and ensure the terminology is accurate to the Dars-e-Nizami curriculum.
  `;

  // Fallback to API Key (if provided)
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing text:", error);
    // If it's a 403/Forbidden, it might be due to missing/invalid key
    const errStr = String(error);
    if (errStr.includes("API_KEY_INVALID") || errStr.includes("403") || errStr.includes("API key is missing")) {
      throw new Error("API Key غائب ہے یا کام نہیں کر رہی۔ براہ کرم اپنی سیٹنگز چیک کریں۔");
    }
    throw new Error("تحقیق کے دوران خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔");
  }
}

export async function translateUiLabels(targetLanguage: string) {
  const baseLabels = {
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
  };

  const prompt = `
    Translate the following UI labels from Urdu to ${targetLanguage}. 
    Maintain the scholarly and respectful tone.
    Return ONLY a valid JSON object with the same keys.
    
    Labels to translate:
    ${JSON.stringify(baseLabels, null, 2)}
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error translating labels:", error);
    return null;
  }
}
