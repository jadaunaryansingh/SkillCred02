import { LanguageDetectionResult } from "@shared/api";

// Simple language detection based on character patterns and common words
// In a production app, you'd use a proper language detection library
const languagePatterns = {
  en: {
    patterns: [/\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|you)\b/gi],
    name: "English"
  },
  es: {
    patterns: [/\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al)\b/gi],
    name: "Spanish"
  },
  fr: {
    patterns: [/\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec)\b/gi],
    name: "French"
  },
  de: {
    patterns: [/\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht)\b/gi],
    name: "German"
  },
  it: {
    patterns: [/\b(il|di|che|e|la|per|un|in|con|del|da|dal|le|si|non|ci|lo|questo)\b/gi],
    name: "Italian"
  },
  pt: {
    patterns: [/\b(o|de|e|do|da|em|um|para|com|não|uma|os|no|se|na|por|mais|as|dos)\b/gi],
    name: "Portuguese"
  },
  ru: {
    patterns: [/[а-яё]/gi],
    name: "Russian"
  },
  ja: {
    patterns: [/[ひらがなカタカナ漢字]/gi],
    name: "Japanese"
  },
  ko: {
    patterns: [/[가-힣]/gi],
    name: "Korean"
  },
  zh: {
    patterns: [/[一-龯]/gi],
    name: "Chinese"
  },
  ar: {
    patterns: [/[ا-ي]/gi],
    name: "Arabic"
  },
  hi: {
    patterns: [/[अ-ह]/gi],
    name: "Hindi"
  }
};

export function detectLanguage(text: string): LanguageDetectionResult {
  const cleanText = text.toLowerCase();
  const scores: { [key: string]: number } = {};
  
  // Calculate scores for each language
  for (const [code, { patterns }] of Object.entries(languagePatterns)) {
    scores[code] = 0;
    
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        scores[code] += matches.length;
      }
    }
  }
  
  // Find the language with the highest score
  const detectedLang = Object.entries(scores).reduce((a, b) => 
    scores[a[0]] > scores[b[0]] ? a : b
  );
  
  const languageCode = detectedLang[0];
  const confidence = Math.min(detectedLang[1] / (text.split(' ').length || 1), 1);
  
  return {
    language: languagePatterns[languageCode as keyof typeof languagePatterns].name,
    confidence: Math.max(confidence, 0.1), // Minimum confidence
    iso639_1: languageCode
  };
}
