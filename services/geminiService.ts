import { GoogleGenAI } from "@google/genai";

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

const getAiClient = () => {
  const apiKey = getSavedGeminiApiKey() || getBuildTimeApiKey();
  if (!apiKey) {
    throw new Error("A Gemini API key is required for generation on GitHub Pages. Enter one in the preview screen and try again.");
  }
  return new GoogleGenAI({ apiKey });
};

const cleanBase64 = (base64Str: string): string => {
  if (base64Str.includes(',')) {
    return base64Str.split(',')[1];
  }
  return base64Str;
};

export interface ColoringPageResult {
  withText: string;
  withoutText: string;
  cleanedUp: string;
}

const generateImage = async (
  ai: GoogleGenAI, 
  base64Data: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: prompt
        },
      ],
    },
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("No image generated");
};

const preprocessImage = async (
  ai: GoogleGenAI,
  base64Data: string,
  mimeType: string
): Promise<string> => {
  // Updated to be conditional so it doesn't hallucinate "paper" on real photos
  const prompt = `
    TASK: IMAGE PREPARATION & GEOMETRY CORRECTION
    INPUT: An image (could be a photo of a sketch, or a direct photo of a scene).
    
    INSTRUCTIONS:
    1. **ANALYZE**: Look at the image content. Is this a photo of a physical piece of paper lying on a surface (desk, floor)?
    
    2. **IF PAPER DETECTED**:
       - CROP to the edges of the paper. Remove the desk/background.
       - FLATTEN the perspective (orthographic view).
       
    3. **IF NO PAPER DETECTED** (e.g. a photo of people, a landscape, or a digital image):
       - KEEP the image exactly as is.
       - DO NOT crop out the subjects.
       - DO NOT warp the perspective.
    
    OUTPUT: The prepared image, ready for line-art conversion.
  `;
  return generateImage(ai, base64Data, mimeType, prompt);
};

export const generateColoringPage = async (
  base64Image: string, 
  mimeType: string = 'image/jpeg',
  customInstruction: string = ''
): Promise<ColoringPageResult> => {
  try {
    const ai = getAiClient();
    const originalCleanData = cleanBase64(base64Image);

    // STEP 1: Pre-process (Crop & Flatten ONLY if it's a sketch)
    let workingBase64 = originalCleanData;
    try {
      const flattenedImage = await preprocessImage(ai, originalCleanData, mimeType);
      workingBase64 = cleanBase64(flattenedImage);
    } catch (error) {
      console.warn("Preprocessing failed. Proceeding with original image.", error);
    }

    // STEP 2: Generate Variations
    // Prompts updated to include custom user instructions which override defaults

    const promptTrace = `
      TASK: HIGH FIDELITY LINE ART
      - The input is an image.
      - Convert it to a detailed black-and-white line drawing (coloring page style).
      
      USER CUSTOM INSTRUCTION (IMPORTANT OVERRIDE):
      ${customInstruction ? `"${customInstruction}" - PRIORITIZE THIS INSTRUCTION.` : "None."}
      
      RULES:
      - **FIDELITY IS PARAMOUNT**: Trace the visual edges EXACTLY. 
      - **IF PHOTO**: Do not "cartoonize" or "characterize" the people. Outline their actual features, clothes, and poses as they appear. Use an "edge detection" approach.
      - **IF SKETCH**: Trace the existing lines exactly.
      - **STYLE**: Pure BLACK lines on Pure WHITE background. NO FILLS.
      ${customInstruction ? `- **MODIFICATION**: Apply the user's custom instruction to the subject matter.` : ''}
    `;

    const promptNoText = `
      TASK: LINE ART - NO TEXT
      - Convert input to black-and-white line art.
      - **REMOVE** any handwritten or printed text, captions, or speech bubbles. Leave those areas blank (white).
      - **KEEP** all other visual subjects (people, objects, drawings).
      
      USER CUSTOM INSTRUCTION (IMPORTANT OVERRIDE):
      ${customInstruction ? `"${customInstruction}" - PRIORITIZE THIS INSTRUCTION.` : "None."}

      RULES:
      - **FIDELITY**: Maintain the exact look of the non-text elements.
      - **STYLE**: Pure BLACK lines on Pure WHITE background.
      ${customInstruction ? `- **MODIFICATION**: Apply the user's custom instruction.` : ''}
    `;

    const promptGreyGuide = `
      TASK: 3-COLOR GUIDE STYLE
      - Create a specific style of coloring page.
      
      PALETTE:
      1. **WHITE**: Background.
      2. **GREY**: The main drawing/subject outlines. (Thin, light-to-mid grey).
      3. **BLACK**: Text/Handwriting ONLY. (Slightly thicker).
      
      USER CUSTOM INSTRUCTION (IMPORTANT OVERRIDE):
      ${customInstruction ? `"${customInstruction}" - PRIORITIZE THIS INSTRUCTION.` : "None."}

      RULES:
      - **NO FILLS**: All interiors must be WHITE. Even dark areas (shadows, hair, clothing) must be OUTLINED in GREY.
      - **FIDELITY**: Keep the subjects exactly as they are. Do not cartoonize real photos.
      - **TEXT**: If there is text, make it BLACK. If no text, just use GREY for the drawing.
    `;

    const [withText, withoutText, cleanedUp] = await Promise.all([
      generateImage(ai, workingBase64, mimeType, promptTrace),
      generateImage(ai, workingBase64, mimeType, promptNoText),
      generateImage(ai, workingBase64, mimeType, promptGreyGuide)
    ]);

    return { withText, withoutText, cleanedUp };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};