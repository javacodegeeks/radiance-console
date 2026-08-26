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

/** AM/PM sequencing + interaction guidance for `recommendations` — see ai/src/agents/recommender.ts. */
export interface Routine {
  am: string[];
  pm: string[];
  interactionWarnings: string[];
}

export type ChatPhase = 'collecting' | 'questioning' | 'processing' | 'done' | 'error';

export interface ChatApiResponse {
  messages: ChatMessage[];
  phase: ChatPhase;
  recommendations?: RecommendationResult[];
  excludedProducts?: ExcludedProductResult[];
  routine?: Routine;
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

/**
 * Same call as sendMessage(), but requests text/event-stream so the backend
 * (chatController.ts) streams a "progress" event per agent step as the
 * LangGraph pipeline advances, before the final "done"/"error" event with the
 * full ChatApiResponse — lets the UI show real progress instead of one
 * opaque multi-second wait.
 */
export async function sendMessageStream(
  req: ChatRequest,
  onProgress: (label: string) => void,
): Promise<ChatApiResponse> {
  // The "Accept: text/event-stream" header is what tells the backend
  // (chatController.ts) to take the SSE branch and stream "progress" events
  // as the LangGraph pipeline advances, instead of returning one plain JSON
  // response — see sendMessage() above for the non-streaming equivalent.
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(req),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Radiance AI server responded with HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line; each frame is one or more
    // "field: value" lines (we only ever send "event" and "data").
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let event = 'message';
      let data = '';
      for (const line of frame.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      if (!data) continue;

      if (event === 'progress') {
        onProgress((JSON.parse(data) as { label: string }).label);
      } else if (event === 'done') {
        return JSON.parse(data) as ChatApiResponse;
      } else if (event === 'error') {
        const parsed = JSON.parse(data) as { error?: string };
        throw new Error(parsed.error ?? 'Unexpected server error');
      }
    }
  }

  throw new Error('Radiance AI server closed the connection before sending a result.');
}

export interface FeedbackRequest {
  sessionId: string;
  productName: string;
  brand: string;
  rating: 'up' | 'down';
}

/** Records a thumbs up/down on a recommended product (see feedbackController.ts). */
export async function sendFeedback(req: FeedbackRequest): Promise<void> {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Radiance AI server responded with HTTP ${res.status}`);
  }
}
