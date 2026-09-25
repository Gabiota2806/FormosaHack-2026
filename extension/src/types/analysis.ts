export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface HighlightedPhrase {
  phrase: string;
  reason: string;
  category: 'URGENCE' | 'AUTHORITY' | 'CREDENTIALS' | 'FAKE_LINK' | 'GREED' | 'FAMILY_IMPERSONATION' | string;
}

export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  risk_level: RiskLevel;
  risk_percentage: number;
  detected_entity: string | null;
  detected_vector: string | null;
  summary: string;
  immediate_action: string;
  what_not_to_do: string;
  highlighted_phrases: HighlightedPhrase[];
  wa_share_text: string;
}

export interface AnalysisResult {
  success: boolean;
  data?: ChatMessageResponse;
  error?: string;
  isOfflineFallback?: boolean;
  statusCode?: number;
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  enableOfflineFallback?: boolean;
}

export interface RiskBadgeConfig {
  text: string;
  color: string;
}
