/**
 * Service layer — single point of contact between the frontend and the
 * Radiance AI backend REST API.
 *
 * All HTTP logic lives here. Components and hooks never call fetch() directly.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RecommendationResult {
  name: string;
  brand: string;
  categories: string[];
  countryAvailability: string[];
  sourceUrl?: string;
  imageUrl?: string;
  safetyStatus: 'safe' | 'caution' | 'unsafe';
  safetyNotes?: string;
  relevanceScore: number;
  availabilityNotes?: string;
  relevanceToQuery?: string;
  reasoning?: string;
  usageTips?: string[];
  confidence?: number;
}

export interface ExcludedProductResult {
  name: string;
  reason: string;
}

export type ChatPhase = 'collecting' | 'questioning' | 'processing' | 'done' | 'error';

export interface ChatApiResponse {
  messages: ChatMessage[];
  phase: ChatPhase;
  recommendations?: RecommendationResult[];
  excludedProducts?: ExcludedProductResult[];
  error?: string;
}

// ─── API call ─────────────────────────────────────────────────────────────────

export async function sendMessage(req: ChatRequest): Promise<ChatApiResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    // The backend returns a JSON body with a specific `error` message even on
    // failure (see chatController.ts) — surface that instead of a generic
    // HTTP status string, falling back only if the body can't be parsed.
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Radiance AI server responded with HTTP ${res.status}`);
  }

  return res.json() as Promise<ChatApiResponse>;
}
