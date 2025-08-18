import multer from 'multer';
import { createWorker } from 'tesseract.js';
import axios from 'axios';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
});

// OCR processing for images
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker();
  
  try {
    const { data: { text } } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

// Enhanced PDF text extraction with better error handling
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Convert buffer to string and try to extract readable text
    const pdfString = buffer.toString('binary');
    
    // Method 1: Look for text streams in PDF (most reliable for text-based PDFs)
    const textRegex = /BT[\s\S]*?ET/g;
    const matches = pdfString.match(textRegex);
    
    if (matches && matches.length > 0) {
      console.log('Found text streams, extracting...');
      let extractedText = '';
      matches.forEach(match => {
        // Extract text between parentheses or brackets
        const textMatches = match.match(/\((.*?)\)|<(.*?)>/g);
        if (textMatches) {
          textMatches.forEach(textMatch => {
            const cleanText = textMatch.replace(/[()<>]/g, '');
            if (cleanText.length > 0 && isReadableText(cleanText)) {
              extractedText += cleanText + ' ';
            }
          });
        }
      });
      
      if (extractedText.trim().length > 0) {
        console.log('Successfully extracted text from streams');
        return cleanExtractedText(extractedText);
      }
    }
    
    // Method 2: Look for any readable text in the PDF (fallback for scanned docs)
    console.log('Text streams not found, trying general text extraction...');
    const readableText = extractReadableText(pdfString);
    if (readableText.length > 20) {
      console.log('Successfully extracted general text');
      return cleanExtractedText(readableText);
    }
    
    // Method 3: Try to find text in specific PDF sections
    console.log('General text extraction failed, trying section extraction...');
    const sectionText = extractFromSections(pdfString);
    if (sectionText.length > 20) {
      console.log('Successfully extracted section text');
      return cleanExtractedText(sectionText);
    }
    
    // Method 4: Last resort - extract ANY text that looks readable
    console.log('Section extraction failed, trying last resort method...');
    const lastResortText = extractLastResortText(pdfString);
    if (lastResortText.length > 10) {
      console.log('Successfully extracted last resort text');
      return cleanExtractedText(lastResortText);
    }
    
    console.log('All extraction methods failed');
    throw new Error('No readable text found in PDF. This might be a scanned document or image-based PDF.');
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please try converting to image or using a different file.');
  }
}

// Helper function to check if text is readable
function isReadableText(text: string): boolean {
  const cleanText = text.trim();
  if (cleanText.length < 2) return false;
  
  // Check if text contains mostly readable characters
  const readableChars = cleanText.match(/[a-zA-Z0-9\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>-]/g);
  const readableRatio = readableChars ? readableChars.length / cleanText.length : 0;
  
  return readableRatio > 0.4; // Reduced from 0.6 to be more lenient
}

// Extract readable text from PDF string
function extractReadableText(pdfString: string): string {
  // Remove PDF-specific control characters and keep readable text
  let text = pdfString
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Remove control chars
    .replace(/[^\x20-\x7E]/g, ' ') // Keep only printable ASCII
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Look for text patterns that might be actual content
  const textPatterns = [
    /[A-Za-z]{2,}/g, // Words with 2+ letters (reduced from 3+)
    /[0-9]+/g, // Numbers
    /[A-Za-z\s]{5,}/g // Longer text sequences (reduced from 10+)
  ];
  
  let extractedText = '';
  textPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      extractedText += matches.join(' ') + ' ';
    }
  });
  
  return extractedText.trim();
}

// Extract text from specific PDF sections
function extractFromSections(pdfString: string): string {
  // Look for common PDF text markers
  const markers = [
    /\/Text\s+(\d+)\s+\d+\s+R/g,
    /\/Contents\s+(\d+)\s+\d+\s+R/g,
    /\/Page\s+(\d+)\s+\d+\s+R/g,
    /\/Font\s+(\d+)\s+\d+\s+R/g,
    /\/Resources\s+(\d+)\s+\d+\s+R/g
  ];
  
  let extractedText = '';
  markers.forEach(marker => {
    const matches = pdfString.match(marker);
    if (matches) {
      // Extract text around these markers
      const startIndex = pdfString.indexOf(matches[0]);
      if (startIndex > -1) {
        const section = pdfString.substring(startIndex, startIndex + 2000); // Increased from 1000
        const cleanSection = section
          .replace(/[^\x20-\x7E]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        extractedText += cleanSection + ' ';
      }
    }
  });
  
  return extractedText.trim();
}

// Last resort text extraction - extract ANY text that might be readable
function extractLastResortText(pdfString: string): string {
  // Convert to string and try to find ANY readable content
  let text = pdfString
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ') // Remove control chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Look for ANY text that might be readable
  const words = text.split(' ');
  const readableWords = words.filter(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    return cleanWord.length > 1 && /[a-zA-Z]/.test(cleanWord);
  });
  
  return readableWords.join(' ');
}

// Clean and validate extracted text
function cleanExtractedText(text: string): string {
  let cleaned = text
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>-]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces again
    .trim();
  
  // Remove very short or repetitive text
  const words = cleaned.split(' ');
  const uniqueWords = [...new Set(words)];
  const uniqueRatio = uniqueWords.length / words.length;
  
  // If text is too repetitive, it might be corrupted
  if (uniqueRatio < 0.3 && words.length > 20) {
    throw new Error('Extracted text appears to be corrupted or unreadable.');
  }
  
  // Limit text length for processing
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000) + '...';
  }
  
  return cleaned;
}

// URL content extraction
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol');
    }

    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'SentimentAI-Bot/1.0'
      }
    });

    const contentType = response.headers['content-type']?.toLowerCase() || '';
    
    if (contentType.includes('text/html')) {
      // Basic HTML text extraction (remove tags)
      const text = response.data
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text;
    } else if (contentType.includes('text/plain')) {
      return response.data.trim();
    } else {
      throw new Error('Unsupported content type');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from URL: ${error.message}`);
    }
    throw new Error('Failed to extract text from URL');
  }
}

// Process file based on type
export async function processFile(file: Express.Multer.File): Promise<string> {
  const { mimetype, buffer } = file;
  
  if (mimetype.startsWith('image/')) {
    return await extractTextFromImage(buffer);
  } else if (mimetype === 'application/pdf') {
    return await extractTextFromPDF(buffer);
  } else {
    throw new Error('Unsupported file type');
  }
}

// Validate and clean extracted text
export function validateExtractedText(text: string): { isValid: boolean; cleanText: string; error?: string } {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      cleanText: '',
      error: 'No text could be extracted from the file'
    };
  }

  const cleanText = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  if (cleanText.length < 3) {
    return {
      isValid: false,
      cleanText,
      error: 'Extracted text is too short for meaningful analysis'
    };
  }

  // Check for corrupted or unreadable text
  const corruptionIndicators = [
    /[^\x20-\x7E\s]/g, // Non-printable characters
    /[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\/<>-]/g, // Unusual characters
    /\b\w{20,}\b/g, // Very long words (likely corrupted)
    /[A-Za-z]{2,}[0-9]{3,}/g, // Mixed alphanumeric patterns
  ];

  let corruptionScore = 0;
  corruptionIndicators.forEach(indicator => {
    const matches = cleanText.match(indicator);
    if (matches) {
      corruptionScore += matches.length;
    }
  });

  // Calculate corruption ratio
  const totalChars = cleanText.length;
  const corruptionRatio = corruptionScore / totalChars;

  if (corruptionRatio > 0.4) {
    return {
      isValid: false,
      cleanText,
      error: 'Extracted text appears to be corrupted or unreadable. This might be a scanned document or image-based PDF. Try converting the PDF to text format or using an image file instead.'
    };
  }

  // Check for repetitive or meaningless text
  const words = cleanText.split(' ');
  const uniqueWords = [...new Set(words)];
  const uniqueRatio = uniqueWords.length / words.length;

  if (uniqueRatio < 0.3 && words.length > 20) {
    return {
      isValid: false,
      cleanText,
      error: 'Extracted text appears to be repetitive or meaningless. This might be a corrupted PDF or scanned document.'
    };
  }

  // Check for minimum meaningful content
  const meaningfulWords = words.filter(word => 
    word.length > 1 && /^[A-Za-z0-9]+$/.test(word) // Allow letters and numbers
  );

  if (meaningfulWords.length < 3) { // Reduced from 5 to 3
    return {
      isValid: false,
      cleanText,
      error: 'Insufficient meaningful text for analysis. Please provide at least 3 meaningful words.'
    };
  }

  if (cleanText.length > 5000) {
    return {
      isValid: true,
      cleanText: cleanText.substring(0, 5000) + '...',
      error: 'Text was truncated to 5000 characters for processing'
    };
  }

  return {
    isValid: true,
    cleanText
  };
}
