export interface HealthResponse {
  status: "ok";
  dbConnected: boolean;
  timestamp: string;
}

// Stage 20: multi-school tenancy. "super_admin" is a platform-level role that
// manages schools and their admins; "admin" is a school-scoped administrator.
export type UserRole = "super_admin" | "admin" | "teacher" | "student";

// Stage 28: the language a student is learning. The platform's internal
// proficiency scale stays CEFR for every language (so all existing level
// handling keeps working); for Chinese the UI simply *labels* those bands with
// the equivalent HSK level -- see HSK_LABELS.
export type TargetLanguage = "english" | "chinese";

export const TARGET_LANGUAGES: TargetLanguage[] = ["english", "chinese"];

export const TARGET_LANGUAGE_LABELS: Record<TargetLanguage, string> = {
  english: "English",
  chinese: "Chinese (Mandarin)",
};

/** Display labels for the CEFR bands when the target language is Chinese. */
export const HSK_LABELS: Record<CefrLevel, string> = {
  A1: "HSK 1",
  A2: "HSK 2",
  B1: "HSK 3",
  B2: "HSK 4",
  C1: "HSK 5",
  C2: "HSK 6",
};

/** The level label to show a learner, given their target language. */
export function levelLabel(level: CefrLevel, language: TargetLanguage): string {
  return language === "chinese" ? HSK_LABELS[level] : level;
}

export interface UserProfile {
  id: number;
  email: string;
  role: UserRole;
  displayName: string;
  mustChangePassword: boolean;
  schoolId: number | null; // null for the platform super_admin
  schoolName: string | null;
  targetLanguage: TargetLanguage;
}

export interface SetTargetLanguageRequest {
  targetLanguage: TargetLanguage;
}

export interface TargetLanguageResponse {
  targetLanguage: TargetLanguage;
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

// Stage 20: multi-school management (super_admin only).
export interface CreateSchoolRequest {
  name: string;
}

export interface SchoolSummary {
  id: number;
  name: string;
  createdAt: string;
  adminCount: number;
  teacherCount: number;
  studentCount: number;
}

export interface CreateSchoolAdminRequest {
  email: string;
  password: string;
  displayName: string;
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

// Stage 25: spaced-repetition scheduling. Each notebook card carries an SM-2
// schedule; `dueAt` is when it next comes up for review.
export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface SrsScheduleDto {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
  /** Convenience flag computed server-side: is this card due now? */
  due: boolean;
}

export interface NotebookEntryDto {
  id: number;
  source: NotebookSource;
  createdAt: string;
  vocabulary: VocabularyDto;
  srs: SrsScheduleDto;
}

export interface SubmitReviewRequest {
  rating: ReviewRating;
}

export interface SubmitReviewResponse {
  entryId: number;
  srs: SrsScheduleDto;
}

export interface ReviewStatsResponse {
  /** Cards due for review now (dueAt <= now). */
  due: number;
  /** Cards still in the early learning phase (repetitions < 2). */
  learning: number;
  /** Cards that have graduated to a long interval (>= 21 days). */
  mature: number;
  /** Total cards in the notebook. */
  total: number;
}

export interface ReviewQueueResponse {
  cards: NotebookEntryDto[];
}

// Stage 26: adaptive CEFR placement test. The server drives an up/down
// staircase, serving one block of items per rung. Items sent to the client
// never include the correct answer (graded server-side, like quizzes).
export interface PlacementItemDto {
  id: string;
  question: string;
  options: string[];
}

export interface PlacementBlockDto {
  sessionId: string;
  level: CefrLevel;
  /** 1-based index of this block within the test, for a progress hint. */
  blockNumber: number;
  items: PlacementItemDto[];
}

export interface SubmitPlacementRequest {
  /** Map of item id -> the option the student chose. */
  answers: Record<string, string>;
}

export type SubmitPlacementResponse =
  | { complete: false; block: PlacementBlockDto }
  | { complete: true; resultLevel: CefrLevel };

export interface PlacementStatusResponse {
  placementLevel: CefrLevel | null;
  completedAt: string | null;
}

// Stage 27: structured curriculum path. A course sequences the existing
// practice modules into an ordered A1->C1 route of units and lessons. Lesson
// completion is derived at read time from the per-module result tables, and
// the recommended entry unit is seeded from the placement level.
export type LessonType =
  | "grammar"
  | "reading"
  | "listening"
  | "writing"
  | "conversation"
  | "quiz";

export interface CurriculumLessonDto {
  /** Stable, unique within the course. */
  id: string;
  type: LessonType;
  /** The referenced content id (grammar topic, passage, clip, prompt), scenario, or quiz category. */
  refId: string;
  title: string;
  completed: boolean;
}

export interface CurriculumUnitDto {
  id: string;
  level: CefrLevel;
  title: string;
  lessons: CurriculumLessonDto[];
  completedCount: number;
  totalCount: number;
}

export interface CurriculumResponse {
  courseTitle: string;
  units: CurriculumUnitDto[];
  placementLevel: CefrLevel | null;
  /** Unit the learner should start/continue with, from their placement level and progress. */
  recommendedUnitId: string | null;
  completedLessons: number;
  totalLessons: number;
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
  /** Stage 28: which language this topic teaches (defaults to English). */
  language?: TargetLanguage;
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
  /** Stage 28: which language this passage teaches (defaults to English). */
  language?: TargetLanguage;
  /** Stage 28: romanisation for Chinese passages, shown behind a toggle. */
  pinyin?: string;
  /** Stage 28: English translation for Chinese passages, shown behind a toggle. */
  translation?: string;
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

// Stage 17: Listening Module. Audio is TTS-synthesized on the client from the
// transcript (reusing the Stage 16 voice selection), so no audio files are
// stored — the "clip" is really a script + AI-generated comprehension.
export interface ListeningClipSummary {
  id: string;
  title: string;
  cefrLevel: CefrLevel;
  estimatedSeconds: number;
}

export interface ListeningClipDetail extends ListeningClipSummary {
  transcript: string;
  sentences: string[]; // transcript split into sentences, for dictation mode
  summary: string;
  vocabularyWords: string[];
  questions: ComprehensionQuestion[];
}

export interface SubmitListeningRequest {
  answers: string[];
}

export interface SubmitListeningResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
}

export interface DictationCheckRequest {
  target: string;
  attempt: string;
}

export interface DictationCheckResponse {
  score: number; // 0-100 word-level similarity
}

export interface ListeningProgressEntry {
  clipId: string;
  title: string;
  cefrLevel: CefrLevel;
  bestScore: number;
  attempts: number;
}

export interface ListeningProgressResponse {
  clips: ListeningProgressEntry[];
  overallAverageScore: number;
}

// Stage 18: Writing Module. Feedback combines deterministic LanguageTool
// grammar/spelling checks (reused from Stage 5) with higher-level LLM analysis.
export interface WritingPromptSummary {
  id: string;
  title: string;
  cefrLevel: CefrLevel;
  wordCountTarget: number;
}

export interface WritingPromptDetail extends WritingPromptSummary {
  prompt: string;
  targetVocabulary: string[];
  grammarFocus: string;
  hints: string[];
}

// A concrete grammar/spelling issue from LanguageTool (not persisted, so no id).
export interface WritingMistake {
  originalText: string;
  correctedText: string;
  ruleDescription: string;
  category: string;
}

export interface WritingFeedback {
  overall: string;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  // Concrete grammar/spelling issues from LanguageTool (may be empty).
  mistakes: WritingMistake[];
  wordCount: number;
}

export interface SubmitWritingRequest {
  text: string;
}

export interface WritingSubmissionSummary {
  id: number;
  promptId: string;
  promptTitle: string;
  wordCount: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  createdAt: string;
}

export interface WritingProgressResponse {
  submissions: WritingSubmissionSummary[];
  totalSubmissions: number;
  averageOverallScore: number;
}

// Stage 19: Quiz Generator. A quiz is AI-generated per category+difficulty and
// stored server-side so the correct answers aren't sent to the client until
// after grading.
export type QuizCategory = "grammar" | "vocabulary" | "everyday_english";
export type QuizQuestionType = "multiple_choice" | "true_false";

export const QUIZ_CATEGORY_LABELS: Record<QuizCategory, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  everyday_english: "Everyday English",
};

export interface GenerateQuizRequest {
  category: QuizCategory;
  difficultyLevel: CefrLevel;
}

// The client's view of a question — no correctAnswer/explanation until graded.
export interface QuizQuestionForStudent {
  type: QuizQuestionType;
  question: string;
  options: string[];
}

export interface QuizDto {
  quizId: string;
  category: QuizCategory;
  difficultyLevel: CefrLevel;
  questions: QuizQuestionForStudent[];
}

export interface SubmitQuizRequest {
  answers: string[]; // one per question, in order
}

export interface QuizQuestionResult {
  question: string;
  options: string[];
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResultResponse {
  score: number;
  correctCount: number;
  totalQuestions: number;
  results: QuizQuestionResult[];
}

export interface QuizProgressEntry {
  quizId: string;
  category: QuizCategory;
  difficultyLevel: CefrLevel;
  score: number;
  createdAt: string;
}

export interface QuizProgressResponse {
  recent: QuizProgressEntry[];
  totalQuizzes: number;
  averageScore: number;
}

// Stage 22: unified learning history across all practice modules.
export type LearningActivityType =
  | "conversation"
  | "grammar"
  | "reading"
  | "listening"
  | "writing"
  | "quiz"
  | "pronunciation";

export interface LearningHistoryEntry {
  type: LearningActivityType;
  title: string;
  detail: string | null;
  score: number | null; // 0-100 where applicable
  createdAt: string;
}

export interface LearningHistoryResponse {
  entries: LearningHistoryEntry[];
  totalActivities: number;
  averageScore: number;
}

// Stage 23: instructor-authored conversation topics.
export interface CustomTopicDto {
  id: number;
  title: string;
  prompt: string;
  createdAt: string;
}

export interface CreateCustomTopicRequest {
  title: string;
  prompt: string;
}

// One entry in the student's conversation topic picker — either a built-in
// scenario (value is the scenario key) or a custom topic (value is "custom:<id>").
export interface ConversationTopicOption {
  value: string;
  label: string;
  isCustom: boolean;
}
