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
