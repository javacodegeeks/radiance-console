// Re-export from the service layer so components can import from either place.
// Keeping types co-located with the HTTP contract avoids drift.
export type {
  ChatMessage,
  RecommendationResult,
  ChatPhase,
  ChatRequest,
  ChatApiResponse,
} from '@/services/radianceClient';
