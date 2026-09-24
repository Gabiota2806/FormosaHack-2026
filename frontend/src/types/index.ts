export interface HighlightedPhrase {
  phrase: string;
  reason: string;
  category: 'URGENCE' | 'AUTHORITY' | 'CREDENTIALS' | 'FAKE_LINK' | 'GREED';
}

export interface ChatAnalysisResponse {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_percentage: number;
  detected_entity?: string;
  detected_vector?: string;
  summary: string;
  immediate_action: string;
  what_not_to_do: string;
  highlighted_phrases: HighlightedPhrase[];
  wa_share_text: string;
}

export interface IncidentItem {
  id: number;
  title: string;
  description: string;
  impersonated_entity: string;
  attack_vector: string;
  evidence_text?: string;
  suspicious_phone?: string;
  suspicious_url?: string;
  fake_cbu?: string;
  votes_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_outbreak_spike?: boolean;
}

export interface IncidentPaginationResponse {
  items: IncidentItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_active_outbreak: boolean;
  outbreak_entity?: string;
}

export interface OfficialChannel {
  id: number;
  entity_name: string;
  official_domains: string;
  official_phones: string;
  emergency_phone: string;
  verified_whatsapp?: string;
  advice?: string;
}
