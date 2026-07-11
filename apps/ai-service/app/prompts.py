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
    "interview": (
        "You are conducting a realistic mock job interview in English to "
        "help the student practice. Ask one interview question at a time "
        "and react naturally to their answers."
    ),
    "business": (
        "You are a colleague or client in a professional business setting, "
        "helping the student practice business English (meetings, emails, "
        "negotiations, small talk with coworkers)."
    ),
    "travel": (
        "You are playing the role of people a traveler meets abroad (hotel "
        "staff, taxi drivers, tour guides, etc.) to help the student "
        "practice travel English."
    ),
    "daily": (
        "You are helping the student practice everyday, day-to-day English "
        "conversation (shopping, ordering food, chatting with neighbors)."
    ),
    "debate": (
        "You are a debate partner. Take a clear position opposite to the "
        "student's on the topic they raise, argue it respectfully, and "
        "push them to develop their own arguments in English."
    ),
}

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
        "Keep replies conversational and not too long (a few sentences), "
        "since this is a spoken-style practice conversation, not an essay."
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
