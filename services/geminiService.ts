import { GoogleGenAI } from '@google/genai';

export interface ColoringPageResult {
  withText: string;
  withoutText: string;
  cleanedUp: string;
}

const GEMINI_API_KEY_STORAGE_KEY = 'coloring_pages_gemini_api_key';

const getBuildTimeApiKey = (): string => {
  return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
};

export const getSavedGeminiApiKey = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const saveGeminiApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') return;

  try {
    const trimmed = apiKey.trim();
    if (trimmed) {
      window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch {
    // Local storage is optional. The generation call will show a useful error if no key is available.
  }
};

const getConfiguredApiKey = (): string => {
  return getSavedGeminiApiKey() || getBuildTimeApiKey();
};

const getAIClient = (): GoogleGenAI => {
  const apiKey = getConfiguredApiKey();

  if (!apiKey) {
    throw new Error(
      'A Gemini API key is required for generation on GitHub Pages. Enter a key in the preview screen and try again.'
    );
  }

  return new GoogleGenAI({ apiKey });
};

const stripDataUrlPrefix = (dataUrl: string): string => {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
};

const detectMimeType = (dataUrl: string, fallback: string): string => {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,/);
  return match?.[1] || fallback;
};

const makePrompt = (variant: keyof ColoringPageResult, customInstruction?: string): string => {
  const shared = `Convert the uploaded sketch or photo into clean black-and-white printable coloring book line art.
Use a pure white background, bold clean outlines, no grayscale shading, no color, no hatching, no stippling, no texture, no photographic shadows, and no messy debris.
Keep the main subject recognizable and simplify details into large enclosed areas suitable for coloring.`;

  const instructionText = customInstruction?.trim()
    ? `\n\nUser instructions to follow if reasonable: ${customInstruction.trim()}`
    : '';

  if (variant === 'withText') {
    return `${shared}\nPreserve visible text, labels, signs, or lettering from the original when they appear important.${instructionText}`;
  }

  if (variant === 'withoutText') {
    return `${shared}\nRemove visible text, labels, signs, and lettering. Replace those areas with clean line art or white space.${instructionText}`;
  }

  return `${shared}\nCreate the cleanest guide version: remove visible text, simplify clutter, strengthen the main outlines, and make the result look like a polished coloring page template.${instructionText}`;
};

const generateVariant = async (
  ai: GoogleGenAI,
  imageDataUrl: string,
  fallbackMimeType: string,
  variant: keyof ColoringPageResult,
  customInstruction?: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: detectMimeType(imageDataUrl, fallbackMimeType),
            data: stripDataUrlPrefix(imageDataUrl),
          },
        },
        {
          text: makePrompt(variant, customInstruction),
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: '1:1',
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Gemini did not return an image. Try a simpler or clearer source image.');
};

export const generateColoringPage = async (
  imageDataUrl: string,
  mimeType: string,
  customInstruction?: string
): Promise<ColoringPageResult> => {
  const ai = getAIClient();

  const [withText, withoutText, cleanedUp] = await Promise.all([
    generateVariant(ai, imageDataUrl, mimeType, 'withText', customInstruction),
    generateVariant(ai, imageDataUrl, mimeType, 'withoutText', customInstruction),
    generateVariant(ai, imageDataUrl, mimeType, 'cleanedUp', customInstruction),
  ]);

  return {
    withText,
    withoutText,
    cleanedUp,
  };
};
