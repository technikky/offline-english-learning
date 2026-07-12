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

// Stage 13 conversation redesign: general open-ended modes plus a full set of
// topic-specific scenarios (docs/20-stage13-plan.md). Renamed "interview" ->
// "job_interview", "business" -> "business_meeting", "daily" -> "daily_life"
// for consistency with the new topic names; old stored conversation/
// assignment rows with the previous names still load (the DB column is
// plain text), they just fall back to the AI service's default prompt.
export type Scenario =
  | "free_talk"
  | "role_play"
  | "debate"
  | "travel"
  | "airport"
  | "restaurant"
  | "business_meeting"
  | "job_interview"
  | "shopping"
  | "technology"
  | "sports"
  | "movies"
  | "daily_life"
  | "hospital"
  | "hotel"
  | "school"
  | "university"
  | "coffee_shop"
  | "emergency"
  | "family"
  | "culture";

export const SCENARIO_LABELS: Record<Scenario, string> = {
  free_talk: "Free Talk",
  role_play: "Role Play",
  debate: "Debate Practice",
  travel: "Travel",
  airport: "Airport",
  restaurant: "Restaurant",
  business_meeting: "Business Meeting",
  job_interview: "Job Interview",
  shopping: "Shopping",
  technology: "Technology",
  sports: "Sports",
  movies: "Movies",
  daily_life: "Daily Life",
  hospital: "Hospital",
  hotel: "Hotel",
  school: "School",
  university: "University",
  coffee_shop: "Coffee Shop",
  emergency: "Emergency",
  family: "Family",
  culture: "Culture",
};

export const ALL_SCENARIOS: Scenario[] = Object.keys(SCENARIO_LABELS) as Scenario[];

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// Friendly display names for CEFR levels, per Stage 13's difficulty-tier
// naming (Beginner..Native-like) -- CEFR stays the internal representation
// everywhere (analytics, difficulty heuristic) since it's already wired
// through the whole system; this is purely a display-label mapping.
export const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Native-like",
};

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

export interface StudentSummary {
  id: number;
  email: string;
  displayName: string;
}

export interface ClassDetail extends ClassSummary {
  students: StudentSummary[];
}

export interface CreateAssignmentRequest {
  title: string;
  description: string;
  scenario: Scenario;
  dueDate: string;
}

export interface AssignmentDto {
  id: number;
  title: string;
  description: string;
  scenario: Scenario;
  dueDate: string;
  createdAt: string;
}

export interface AssignmentCompletionDto {
  studentId: number;
  displayName: string;
  completed: boolean;
}

export interface AssignmentWithCompletion extends AssignmentDto {
  completion: AssignmentCompletionDto[];
}

export interface MistakeReviewEntryDto extends GrammarMistakeDto {
  studentId: number;
  studentName: string;
  createdAt: string;
}

export interface FrequencyPoint {
  date: string;
  count: number;
}

export interface VocabularyGrowthPoint {
  date: string;
  cumulativeCount: number;
}

export interface GrammarWeakness {
  category: string;
  count: number;
}

export interface StudentAnalyticsDto {
  studentId: number;
  displayName: string;
  totalConversations: number;
  totalMessages: number;
  estimatedLevel: CefrLevel;
  estimatedPracticeMinutes: number;
  practiceFrequency: FrequencyPoint[];
  grammarWeaknesses: GrammarWeakness[];
  vocabularyGrowth: VocabularyGrowthPoint[];
}

export interface TranscribeRequest {
  audioBase64: string;
}

export interface TranscribeResponse {
  transcript: string;
}

// Stage 16: the AI conversation avatar can speak in a male or female voice;
// the selected gender both picks the Piper voice and which avatar is shown.
export type VoiceGender = "male" | "female";

export interface SynthesizeRequest {
  text: string;
  voice?: VoiceGender; // defaults to female (the original single vendored voice)
}

export interface SynthesizeResponse {
  audioBase64: string;
}

export interface PronunciationPracticeRequest {
  targetPhrase: string;
  audioBase64: string;
}

export interface PronunciationPracticeResponse {
  transcript: string;
  accuracyScore: number;
  feedback: string;
}

// Stage 12: admin system-health / config / model-management / backup DTOs.
export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ServiceHealth {
  name: string;
  reachable: boolean;
  detail?: string;
}

export interface SystemHealthResponse {
  backend: { dbConnected: boolean; uptimeSeconds: number };
  aiService: ServiceHealth & {
    modelLoaded?: boolean;
    modelPath?: string;
    threadCount?: number;
  };
  languageTool: ServiceHealth;
}

export interface ServerConfigResponse {
  port: number;
  host: string;
  tlsEnabled: boolean;
  rateLimitPerMinute: number;
  dbPath: string;
}

export interface AiModelInfo {
  filename: string;
  sizeBytes: number;
  isActive: boolean;
}

export interface SelectAiModelRequest {
  filename: string;
}

// Stage 14: Grammar Learning Module.
export type GrammarLevel = "beginner" | "intermediate" | "advanced";
export type GrammarExerciseType = "multiple_choice" | "fill_blank";

export interface GrammarTopicSummary {
  id: string;
  level: GrammarLevel;
  title: string;
  cefrLevel: CefrLevel;
}

export interface GrammarTopicDetail extends GrammarTopicSummary {
  explanation: string;
  examples: string[];
}

export interface GrammarExerciseDto {
  exerciseType: GrammarExerciseType;
  question: string;
  options: string[]; // empty for fill_blank
  explanation: string;
  // Held client-side (not displayed) until after submission, then echoed
  // back to the submit route -- no server-side session state needed for a
  // single-player local app.
  correctAnswer: string;
}

export interface SubmitGrammarExerciseRequest {
  exerciseType: GrammarExerciseType;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
}

export interface SubmitGrammarExerciseResponse {
  isCorrect: boolean;
  correctAnswer: string;
}

export interface GrammarTopicProgress {
  topicId: string;
  title: string;
  level: GrammarLevel;
  attempts: number;
  correct: number;
  accuracy: number; // 0-100, 0 when no attempts yet
}

export interface GrammarProgressResponse {
  topics: GrammarTopicProgress[];
  overallAccuracy: number;
  totalAttempts: number;
}

// Stage 15: Reading Module.
export interface ReadingPassageSummary {
  id: string;
  title: string;
  cefrLevel: CefrLevel;
  estimatedReadingMinutes: number;
}

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ReadingPassageDetail extends ReadingPassageSummary {
  content: string;
  summary: string;
  vocabularyWords: string[];
  questions: ComprehensionQuestion[];
}

export interface SubmitReadingRequest {
  answers: string[]; // one per question, in question order
}

export interface SubmitReadingResponse {
  score: number; // 0-100
  correctCount: number;
  totalQuestions: number;
}

export interface ReadingProgressEntry {
  passageId: string;
  title: string;
  cefrLevel: CefrLevel;
  bestScore: number;
  attempts: number;
}

export interface ReadingProgressResponse {
  passages: ReadingProgressEntry[];
  overallAverageScore: number;
}
