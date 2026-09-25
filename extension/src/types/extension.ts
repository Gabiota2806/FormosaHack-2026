import type { ChatMessageResponse } from './analysis.js';

export interface AnalysisStorageItem {
  id: string;
  text: string;
  sourceUrl?: string;
  sourceTitle?: string;
  timestamp: number;
  status: 'pending' | 'analyzed' | 'error';
  errorMessage?: string;
  charCount: number;
  result?: ChatMessageResponse;
  isOffline?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedText?: string;
  charCount: number;
}
