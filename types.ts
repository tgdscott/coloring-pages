export interface GenerationResult {
  imageUrl: string | null;
  error: string | null;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PREVIEW = 'PREVIEW',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface ImageDimension {
  width: number;
  height: number;
}