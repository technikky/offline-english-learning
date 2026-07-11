export interface HealthResponse {
  status: "ok";
  dbConnected: boolean;
  timestamp: string;
}

export type UserRole = "admin" | "teacher" | "student";

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  displayName: string;
  mustChangePassword: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: Extract<UserRole, "teacher" | "student">;
}

export interface CreateClassRequest {
  name: string;
}

export interface ClassSummary {
  id: number;
  name: string;
  teacherId: number;
}

export interface RegisterStudentRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface ApiErrorResponse {
  error: string;
}

export type Scenario =
  | "free_talk"
  | "role_play"
  | "interview"
  | "business"
  | "travel"
  | "daily"
  | "debate";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CreateConversationRequest {
  scenario: Scenario;
}

export interface ConversationSummary {
  id: number;
  scenario: Scenario;
  createdAt: string;
}

export interface MessageDto {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  grammarMistakes?: GrammarMistakeDto[];
}

export interface ConversationDetail extends ConversationSummary {
  messages: MessageDto[];
}

export interface SendMessageRequest {
  content: string;
}

export interface GrammarMistakeDto {
  id: number;
  originalText: string;
  correctedText: string;
  ruleId: string;
  ruleDescription: string;
  category: string;
  explanation: string | null;
  example: string | null;
}

export interface ExplainMistakeRequest {
  mistakeId: number;
}

export interface ExplainMistakeResponse {
  explanation: string;
  example: string;
}

export interface VocabularyDto {
  id: number;
  word: string;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  cefrLevel: CefrLevel;
}

export interface LookupWordRequest {
  word: string;
}

export type NotebookSource = "manual" | "recommended";

export interface NotebookEntryDto {
  id: number;
  source: NotebookSource;
  createdAt: string;
  vocabulary: VocabularyDto;
}

export interface SimilarWordsResponse {
  words: VocabularyDto[];
}

export interface RecommendationsResponse {
  words: VocabularyDto[];
}
