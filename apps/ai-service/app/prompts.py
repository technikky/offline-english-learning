# Stage 13 conversation redesign: general open-ended modes plus a full set of
# topic-specific scenarios, each grounding the AI in a concrete situation and
# cast of characters rather than a vague theme. See docs/20-stage13-plan.md.
SCENARIO_PROMPTS = {
    "free_talk": (
        "You are a friendly English conversation partner having a free, "
        "casual chat with a language learner. Talk about whatever the "
        "student brings up."
    ),
    "role_play": (
        "You are role-playing a scene with an English learner to help them "
        "practice. Stay in character, and if no character has been given "
        "yet, ask the student what scenario they'd like to role-play."
    ),
    "debate": (
        "You are a debate partner. Take a clear position opposite to the "
        "student's on the topic they raise, argue it respectfully, and "
        "push them to develop their own arguments in English."
    ),
    "travel": (
        "You are playing the role of people a traveler meets abroad (taxi "
        "drivers, tour guides, fellow travelers, immigration officers) to "
        "help the student practice travel English in varied situations."
    ),
    "airport": (
        "You are an airline check-in agent, security officer, or gate "
        "agent at an airport. Help the student practice checking in, going "
        "through security, boarding, or handling a flight delay."
    ),
    "restaurant": (
        "You are a server at a restaurant. Greet the student, help them "
        "order food and drinks, answer questions about the menu, and "
        "handle the bill at the end -- a realistic full dining experience."
    ),
    "business_meeting": (
        "You are a colleague or client in a professional business "
        "meeting, helping the student practice business English: agenda "
        "items, proposals, disagreements handled diplomatically, and "
        "action items."
    ),
    "job_interview": (
        "You are conducting a realistic mock job interview in English to "
        "help the student practice. Ask one interview question at a time "
        "and react naturally to their answers, including a follow-up "
        "question based on what they said."
    ),
    "shopping": (
        "You are a shop assistant helping the student practice shopping "
        "English: asking about sizes, prices, discounts, trying things on, "
        "and completing a purchase."
    ),
    "technology": (
        "You are a tech-savvy friend or support agent discussing "
        "technology with the student -- gadgets, apps, the internet, or "
        "troubleshooting a device -- in everyday conversational English."
    ),
    "sports": (
        "You are a sports fan discussing sports with the student -- "
        "favorite teams, recent games, playing sports themselves, or "
        "sports news -- keeping the conversation natural and engaged."
    ),
    "movies": (
        "You are a friend discussing movies and TV shows with the "
        "student -- recommendations, opinions on what they've watched, "
        "favorite genres and actors."
    ),
    "daily_life": (
        "You are helping the student practice everyday, day-to-day "
        "English conversation: chatting with a neighbor, running errands, "
        "or small talk about their day."
    ),
    "hospital": (
        "You are a doctor, nurse, or receptionist at a hospital or clinic. "
        "Help the student practice describing symptoms, understanding "
        "instructions, and booking or attending an appointment."
    ),
    "hotel": (
        "You are a hotel receptionist. Help the student practice "
        "checking in and out, asking about hotel amenities, and resolving "
        "a problem with their room."
    ),
    "school": (
        "You are a teacher, classmate, or school administrator. Help the "
        "student practice classroom English: asking questions, discussing "
        "assignments, or talking about school life."
    ),
    "university": (
        "You are a professor, academic advisor, or fellow student at a "
        "university. Help the student practice more academic English: "
        "course registration, office hours, group projects, or campus life."
    ),
    "coffee_shop": (
        "You are a barista at a coffee shop. Help the student practice "
        "ordering drinks and snacks, making small talk while waiting, and "
        "handling a mistake in their order."
    ),
    "emergency": (
        "You are a 911/emergency operator, police officer, or paramedic. "
        "Help the student practice describing an emergency clearly and "
        "calmly and understanding the instructions they're given. Keep "
        "the scenario realistic but not distressing."
    ),
    "family": (
        "You are a family member (parent, sibling, cousin) catching up "
        "with the student. Help them practice talking about family news, "
        "plans, and everyday family life in natural, warm English."
    ),
    "culture": (
        "You are a friend from another country discussing culture with "
        "the student -- traditions, holidays, food, customs, and "
        "comparing cultural differences -- with genuine curiosity."
    ),
}

# Shared pedagogical behavior appended to every scenario (Stage 13): this is
# what makes the AI act like a tutor during the conversation, not just a
# scripted character, regardless of which topic was picked.
PEDAGOGY_INSTRUCTIONS = (
    "Throughout the conversation, behave like a skilled language tutor, "
    "not just a character:\n"
    "- Keep the conversation going naturally; don't let it stall. Ask a "
    "genuine follow-up question based on what the student just said at "
    "least every other turn.\n"
    "- Remember what the student has told you earlier in this "
    "conversation and refer back to it when relevant, the way a real "
    "conversation partner would.\n"
    "- If the student's message has a clear grammar mistake, don't just "
    "ignore it or interrupt the flow with a lecture -- naturally model "
    "the correct form in your own reply (recasting), the way a native "
    "speaker would when talking to a learner. A separate system already "
    "gives the student an explicit correction, so you don't need to "
    "explain the rule yourself unless they ask.\n"
    "- When a natural opportunity comes up, introduce one useful new word "
    "or phrase relevant to the topic and briefly show what it means "
    "through how you use it in context.\n"
    "- Encourage longer, more detailed answers: if the student gives a "
    "short reply, ask a question that invites them to elaborate.\n"
    "- Vary your own sentence structure so the student is exposed to a "
    "range of natural English, not repetitive phrasing."
)

DIFFICULTY_INSTRUCTIONS = {
    "A1": "Use very simple vocabulary and short sentences (beginner, CEFR A1). Avoid idioms.",
    "A2": "Use simple, everyday vocabulary and short sentences (CEFR A2). Avoid idioms and complex grammar.",
    "B1": "Use everyday vocabulary with some variety, moderate sentence length (CEFR B1). A few common idioms are fine.",
    "B2": "Use a broader vocabulary and more complex sentence structures (CEFR B2). Idioms and nuance are fine.",
    "C1": "Use advanced vocabulary, natural idioms, and complex sentence structures (CEFR C1).",
    "C2": "Communicate as you would with a native-level speaker (CEFR C2): full complexity, nuance, and idiom.",
}


def build_system_prompt(scenario: str, difficulty_level: str) -> str:
    scenario_text = SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS["free_talk"])
    difficulty_text = DIFFICULTY_INSTRUCTIONS.get(
        difficulty_level, DIFFICULTY_INSTRUCTIONS["B1"]
    )
    return (
        f"{scenario_text}\n\n"
        f"Adapt your English to the student's level: {difficulty_text}\n\n"
        f"{PEDAGOGY_INSTRUCTIONS}\n\n"
        "Keep replies conversational and not too long (2-4 sentences plus "
        "your follow-up question), since this is a spoken-style practice "
        "conversation, not an essay."
    )


GRAMMAR_EXPLAIN_MARKERS = ("EXPLANATION:", "EXAMPLE:")


def build_grammar_explain_prompt(
    original_text: str,
    corrected_text: str,
    rule_description: str,
    difficulty_level: str,
) -> list[dict]:
    difficulty_text = DIFFICULTY_INSTRUCTIONS.get(
        difficulty_level, DIFFICULTY_INSTRUCTIONS["B1"]
    )
    system = (
        "You are a friendly, patient English grammar tutor explaining a "
        "mistake to a student, step by step, using beginner-friendly "
        "language. "
        f"{difficulty_text}\n\n"
        "Respond in exactly this format, with nothing before or after:\n"
        "EXPLANATION: <a short, step-by-step explanation of why the "
        "original was wrong and how the correction fixes it>\n"
        "EXAMPLE: <one short additional example sentence demonstrating the "
        "same rule, correctly used>"
    )
    user = (
        f'Original (incorrect): "{original_text}"\n'
        f'Corrected: "{corrected_text}"\n'
        f"Grammar rule involved: {rule_description}"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def parse_grammar_explain_response(raw_text: str) -> tuple[str, str]:
    """Lenient parse: a small local model won't reliably produce strict
    JSON, so we ask for two marked sections and split on them instead of
    failing hard if the format drifts slightly."""
    explanation_marker, example_marker = GRAMMAR_EXPLAIN_MARKERS

    if explanation_marker in raw_text and example_marker in raw_text:
        _, rest = raw_text.split(explanation_marker, 1)
        explanation_part, example_part = rest.split(example_marker, 1)
        return explanation_part.strip(), example_part.strip()

    return raw_text.strip(), ""


VOCABULARY_EXPLAIN_MARKERS = ("DEFINITION:", "EXAMPLE:", "SYNONYMS:", "ANTONYMS:", "CEFR:")


def build_vocabulary_explain_prompt(word: str, difficulty_level: str) -> list[dict]:
    difficulty_text = DIFFICULTY_INSTRUCTIONS.get(
        difficulty_level, DIFFICULTY_INSTRUCTIONS["B1"]
    )
    system = (
        "You are a helpful English vocabulary tutor. A student wants to "
        f"understand the word they encountered. {difficulty_text}\n\n"
        "Respond in exactly this format, with nothing before or after, one "
        "item per line:\n"
        "DEFINITION: <a short, clear definition>\n"
        "EXAMPLE: <one example sentence using the word naturally>\n"
        "SYNONYMS: <2-4 synonyms, comma-separated, or 'none' if there are none>\n"
        "ANTONYMS: <2-4 antonyms, comma-separated, or 'none' if there are none>\n"
        "CEFR: <the word's own intrinsic difficulty level, exactly one of "
        "A1, A2, B1, B2, C1, C2>"
    )
    user = f'Word: "{word}"'
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _extract_marked_section(raw_text: str, start_marker: str, end_marker: str | None) -> str:
    if start_marker not in raw_text:
        return ""
    _, rest = raw_text.split(start_marker, 1)
    if end_marker and end_marker in rest:
        rest, _ = rest.split(end_marker, 1)
    return rest.strip()


def parse_vocabulary_explain_response(raw_text: str) -> dict:
    """Lenient marker-based parse, same reasoning as grammar explain. Falls
    back to empty/placeholder values per field rather than raising, since a
    partially-parsed response is still more useful to the student than a 500."""
    definition_m, example_m, synonyms_m, antonyms_m, cefr_m = VOCABULARY_EXPLAIN_MARKERS

    definition = _extract_marked_section(raw_text, definition_m, example_m) or raw_text.strip()
    example = _extract_marked_section(raw_text, example_m, synonyms_m)
    synonyms_raw = _extract_marked_section(raw_text, synonyms_m, antonyms_m)
    antonyms_raw = _extract_marked_section(raw_text, antonyms_m, cefr_m)
    cefr_raw = _extract_marked_section(raw_text, cefr_m, None)

    def parse_word_list(raw: str) -> list[str]:
        if not raw or raw.strip().lower() == "none":
            return []
        return [w.strip() for w in raw.split(",") if w.strip()]

    valid_cefr_levels = {"A1", "A2", "B1", "B2", "C1", "C2"}
    cefr_level = cefr_raw.strip().upper()
    if cefr_level not in valid_cefr_levels:
        cefr_level = "B1"

    return {
        "definition": definition,
        "example": example,
        "synonyms": parse_word_list(synonyms_raw),
        "antonyms": parse_word_list(antonyms_raw),
        "cefrLevel": cefr_level,
    }


# Stage 14: Grammar Learning Module exercise generation. Reuses the same
# lenient marker-based parsing pattern as grammar/vocabulary explain above,
# for the same reason -- a 1.5B local model isn't reliable at strict JSON.
GRAMMAR_EXERCISE_MARKERS = ("QUESTION:", "OPTIONS:", "ANSWER:", "EXPLANATION:")


def build_grammar_exercise_prompt(
    topic_title: str,
    topic_explanation: str,
    difficulty_level: str,
    exercise_type: str,
) -> list[dict]:
    difficulty_text = DIFFICULTY_INSTRUCTIONS.get(
        difficulty_level, DIFFICULTY_INSTRUCTIONS["B1"]
    )

    if exercise_type == "multiple_choice":
        format_instructions = (
            "Respond in exactly this format, with nothing before or after:\n"
            "QUESTION: <a sentence with one word or phrase blanked out as "
            "____, testing the grammar point above>\n"
            "OPTIONS: <exactly 4 possible answers, comma-separated, one of "
            "which correctly fills the blank>\n"
            "ANSWER: <the single correct option, exactly as written in "
            "OPTIONS>\n"
            "EXPLANATION: <one sentence explaining why that answer is "
            "correct>"
        )
    else:
        format_instructions = (
            "Respond in exactly this format, with nothing before or after:\n"
            "QUESTION: <a sentence with one word or short phrase blanked out "
            "as ____, testing the grammar point above>\n"
            "ANSWER: <the exact word or phrase that correctly fills the "
            "blank>\n"
            "EXPLANATION: <one sentence explaining why that answer is "
            "correct>"
        )

    system = (
        "You are an English grammar tutor creating a practice exercise for "
        f"a student on this grammar topic: {topic_title}.\n"
        f"Topic explanation: {topic_explanation}\n\n"
        f"{difficulty_text}\n\n"
        "Create exactly one new exercise. Make it different each time you "
        "are asked, using varied vocabulary and sentence subjects so the "
        "student doesn't just memorize one sentence.\n\n"
        f"{format_instructions}"
    )
    return [{"role": "system", "content": system}]


def parse_grammar_exercise_response(raw_text: str, exercise_type: str) -> dict:
    """Falls back to a safe placeholder exercise rather than raising if
    parsing fails outright, since a broken practice round is better handled
    client-side than as a 500 during a study session."""
    question_m, options_m, answer_m, explanation_m = GRAMMAR_EXERCISE_MARKERS

    question = _extract_marked_section(raw_text, question_m, options_m if exercise_type == "multiple_choice" else answer_m)
    if exercise_type == "multiple_choice":
        options_raw = _extract_marked_section(raw_text, options_m, answer_m)
        options = [o.strip() for o in options_raw.split(",") if o.strip()]
    else:
        options = []
    answer = _extract_marked_section(raw_text, answer_m, explanation_m)
    explanation = _extract_marked_section(raw_text, explanation_m, None)

    if not question or not answer:
        # Parsing failed outright -- return the raw text as the question so
        # the student sees *something* meaningful rather than a blank field.
        return {
            "question": raw_text.strip() or "Could not generate an exercise. Please try again.",
            "options": [],
            "correctAnswer": "",
            "explanation": "",
        }

    return {
        "question": question,
        "options": options,
        "correctAnswer": answer,
        "explanation": explanation,
    }


# Stage 15: Reading Module comprehension generation. Uses a numbered-marker
# format (Q1/OPTIONS1/ANSWER1 .. Q4/OPTIONS4/ANSWER4) rather than a single
# repeated block, since that's easier for a small local model to follow
# consistently than an open-ended "repeat this format N times" instruction.
READING_COMPREHENSION_QUESTION_COUNT = 4


def build_reading_comprehension_prompt(passage_content: str, cefr_level: str) -> list[dict]:
    difficulty_text = DIFFICULTY_INSTRUCTIONS.get(cefr_level, DIFFICULTY_INSTRUCTIONS["B1"])

    question_format = "\n".join(
        f"Q{i}: <question {i} about the passage>\n"
        f"OPTIONS{i}: <exactly 4 possible answers, comma-separated>\n"
        f"ANSWER{i}: <the correct option, exactly as written in OPTIONS{i}>"
        for i in range(1, READING_COMPREHENSION_QUESTION_COUNT + 1)
    )

    system = (
        "You are an English reading comprehension tutor. Read the passage "
        "below and create study material for a student. "
        f"{difficulty_text}\n\n"
        "Respond in exactly this format, with nothing before or after:\n"
        "SUMMARY: <a 2-3 sentence summary of the passage>\n"
        "VOCABULARY: <5-8 useful or challenging words from the passage, "
        "comma-separated>\n"
        f"{question_format}"
    )
    user = f"Passage:\n{passage_content}"
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def parse_reading_comprehension_response(raw_text: str) -> dict:
    """Falls back to an empty question list (rather than raising) if a
    question block fails to parse -- a passage with a shorter-than-usual
    question set is still useful, unlike a 500 during a reading exercise."""
    summary = _extract_marked_section(raw_text, "SUMMARY:", "VOCABULARY:")
    vocabulary_raw = _extract_marked_section(raw_text, "VOCABULARY:", "Q1:")
    vocabulary_words = [w.strip() for w in vocabulary_raw.split(",") if w.strip()]

    questions = []
    for i in range(1, READING_COMPREHENSION_QUESTION_COUNT + 1):
        question_marker = f"Q{i}:"
        options_marker = f"OPTIONS{i}:"
        answer_marker = f"ANSWER{i}:"
        next_marker = f"Q{i + 1}:" if i < READING_COMPREHENSION_QUESTION_COUNT else None

        question_text = _extract_marked_section(raw_text, question_marker, options_marker)
        options_raw = _extract_marked_section(raw_text, options_marker, answer_marker)
        answer_text = _extract_marked_section(raw_text, answer_marker, next_marker)

        if not question_text or not answer_text:
            continue

        options = [o.strip() for o in options_raw.split(",") if o.strip()]
        questions.append(
            {"question": question_text, "options": options, "correctAnswer": answer_text}
        )

    return {
        "summary": summary or raw_text.strip(),
        "vocabularyWords": vocabulary_words,
        "questions": questions,
    }
