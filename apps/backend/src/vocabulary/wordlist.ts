import type { CefrLevel, TargetLanguage } from "@englishclass/types";

// Stage 33: a curated, CEFR-graded core wordlist.
//
// Why this exists. Until now the only "wordlist" in the system was
// commonWords.ts -- a 75-word stoplist -- which left two things weak:
//   1. Vocabulary recommendations were a crude heuristic ("longer than 6
//      letters and not a stopword"), which flags any long word regardless of
//      whether it is actually worth learning.
//   2. The spaced-repetition notebook (Stage 25) had nothing to seed from: a
//      learner only ever got cards for words they happened to look up, so the
//      single most effective retention mechanism in the platform sat idle
//      until they went hunting for words themselves.
//
// This list fixes both, and adds a third benefit: because each entry carries an
// authored definition and example, looking one of these words up **skips the
// LLM entirely** (see lookup.ts) -- instant, and far more reliable than a 1.5B
// model's guess. The AI remains the fallback for words outside the list.
//
// It is a *core* list, not a dictionary: high-frequency, high-utility words a
// learner genuinely needs at each level. Extending it is appending here.

export interface WordlistEntry {
  word: string;
  cefrLevel: CefrLevel;
  /** Stage 34: which language this word belongs to (defaults to English). */
  language?: TargetLanguage;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
}

const WORDLIST: WordlistEntry[] = [
  // ---------- A1 ----------
  { word: "family", cefrLevel: "A1", definition: "A group of people who are related to you, such as parents, children and siblings.", example: "I live with my family in a small house.", synonyms: ["relatives"], antonyms: [] },
  { word: "friend", cefrLevel: "A1", definition: "Someone you like and enjoy spending time with, who is not family.", example: "My best friend lives next door.", synonyms: ["companion"], antonyms: ["enemy"] },
  { word: "house", cefrLevel: "A1", definition: "A building where people live.", example: "Their house has a red door.", synonyms: ["home"], antonyms: [] },
  { word: "water", cefrLevel: "A1", definition: "The clear liquid that people and animals drink.", example: "Please give me a glass of water.", synonyms: [], antonyms: [] },
  { word: "morning", cefrLevel: "A1", definition: "The early part of the day, from when you wake up until midday.", example: "I drink tea every morning.", synonyms: [], antonyms: ["evening"] },
  { word: "school", cefrLevel: "A1", definition: "A place where children go to learn.", example: "She walks to school with her brother.", synonyms: [], antonyms: [] },
  { word: "happy", cefrLevel: "A1", definition: "Feeling pleased and satisfied.", example: "I am happy to see you.", synonyms: ["glad", "pleased"], antonyms: ["sad"] },
  { word: "big", cefrLevel: "A1", definition: "Large in size.", example: "They live in a big city.", synonyms: ["large"], antonyms: ["small"] },
  { word: "small", cefrLevel: "A1", definition: "Little in size.", example: "I have a small dog.", synonyms: ["little"], antonyms: ["big"] },
  { word: "eat", cefrLevel: "A1", definition: "To put food in your mouth and swallow it.", example: "We eat dinner at seven.", synonyms: [], antonyms: [] },
  { word: "drink", cefrLevel: "A1", definition: "To take liquid into your mouth and swallow it.", example: "He does not drink coffee.", synonyms: [], antonyms: [] },
  { word: "work", cefrLevel: "A1", definition: "A job you do to earn money; or to do that job.", example: "My mother works in a hospital.", synonyms: ["job"], antonyms: [] },
  { word: "book", cefrLevel: "A1", definition: "A set of printed pages you read.", example: "This book is very interesting.", synonyms: [], antonyms: [] },
  { word: "food", cefrLevel: "A1", definition: "Things that people and animals eat.", example: "The food at this restaurant is good.", synonyms: [], antonyms: [] },
  { word: "city", cefrLevel: "A1", definition: "A large town where many people live.", example: "Tokyo is a very large city.", synonyms: [], antonyms: ["village"] },
  { word: "night", cefrLevel: "A1", definition: "The dark part of the day, when most people sleep.", example: "It is cold at night.", synonyms: [], antonyms: ["day"] },
  { word: "buy", cefrLevel: "A1", definition: "To get something by paying money for it.", example: "I want to buy a new phone.", synonyms: ["purchase"], antonyms: ["sell"] },
  { word: "walk", cefrLevel: "A1", definition: "To move forward on your feet.", example: "We walk to the park every Sunday.", synonyms: [], antonyms: [] },
  { word: "read", cefrLevel: "A1", definition: "To look at words and understand them.", example: "She likes to read before bed.", synonyms: [], antonyms: [] },
  { word: "write", cefrLevel: "A1", definition: "To make words on paper or a screen.", example: "Please write your name here.", synonyms: [], antonyms: [] },
  { word: "teacher", cefrLevel: "A1", definition: "A person whose job is to teach.", example: "Our teacher is very kind.", synonyms: ["instructor"], antonyms: ["student"] },
  { word: "student", cefrLevel: "A1", definition: "A person who is learning at a school or university.", example: "He is a student at the university.", synonyms: ["pupil"], antonyms: ["teacher"] },
  { word: "car", cefrLevel: "A1", definition: "A vehicle with four wheels that people drive.", example: "My father drives an old car.", synonyms: ["automobile"], antonyms: [] },
  { word: "money", cefrLevel: "A1", definition: "Coins and notes used to buy things.", example: "I do not have enough money.", synonyms: ["cash"], antonyms: [] },
  { word: "week", cefrLevel: "A1", definition: "A period of seven days.", example: "I go swimming twice a week.", synonyms: [], antonyms: [] },
  { word: "open", cefrLevel: "A1", definition: "To move something so it is not closed.", example: "Can you open the window?", synonyms: [], antonyms: ["close"] },
  { word: "help", cefrLevel: "A1", definition: "To do something useful for someone.", example: "Can you help me, please?", synonyms: ["assist"], antonyms: [] },
  { word: "learn", cefrLevel: "A1", definition: "To get new knowledge or a new skill.", example: "I want to learn English.", synonyms: ["study"], antonyms: [] },
  { word: "listen", cefrLevel: "A1", definition: "To pay attention to a sound.", example: "Listen to this song.", synonyms: [], antonyms: [] },
  { word: "speak", cefrLevel: "A1", definition: "To say words; to talk.", example: "Do you speak English?", synonyms: ["talk"], antonyms: [] },

  // ---------- A2 ----------
  { word: "arrive", cefrLevel: "A2", definition: "To reach a place at the end of a journey.", example: "We arrived at the station early.", synonyms: ["reach"], antonyms: ["depart"] },
  { word: "borrow", cefrLevel: "A2", definition: "To take something for a short time and give it back later.", example: "Can I borrow your pen?", synonyms: [], antonyms: ["lend"] },
  { word: "busy", cefrLevel: "A2", definition: "Having a lot to do.", example: "She is busy this afternoon.", synonyms: ["occupied"], antonyms: ["free"] },
  { word: "cheap", cefrLevel: "A2", definition: "Costing little money.", example: "This restaurant is cheap but good.", synonyms: ["inexpensive"], antonyms: ["expensive"] },
  { word: "decide", cefrLevel: "A2", definition: "To choose what to do after thinking.", example: "We decided to stay at home.", synonyms: ["choose"], antonyms: [] },
  { word: "enough", cefrLevel: "A2", definition: "As much as you need.", example: "There is enough food for everyone.", synonyms: ["sufficient"], antonyms: [] },
  { word: "expensive", cefrLevel: "A2", definition: "Costing a lot of money.", example: "That coat is too expensive.", synonyms: ["costly"], antonyms: ["cheap"] },
  { word: "forget", cefrLevel: "A2", definition: "To not remember something.", example: "Do not forget your keys.", synonyms: [], antonyms: ["remember"] },
  { word: "healthy", cefrLevel: "A2", definition: "Good for your body, or not ill.", example: "She eats a healthy breakfast.", synonyms: ["well"], antonyms: ["unhealthy"] },
  { word: "invite", cefrLevel: "A2", definition: "To ask someone to come somewhere or do something.", example: "They invited us to dinner.", synonyms: ["ask"], antonyms: [] },
  { word: "journey", cefrLevel: "A2", definition: "A trip from one place to another.", example: "The journey takes two hours.", synonyms: ["trip"], antonyms: [] },
  { word: "kitchen", cefrLevel: "A2", definition: "The room where food is prepared.", example: "He is cooking in the kitchen.", synonyms: [], antonyms: [] },
  { word: "lend", cefrLevel: "A2", definition: "To give something to someone for a short time.", example: "Could you lend me ten pounds?", synonyms: [], antonyms: ["borrow"] },
  { word: "message", cefrLevel: "A2", definition: "Information you send to someone.", example: "I sent her a message this morning.", synonyms: ["note"], antonyms: [] },
  { word: "neighbour", cefrLevel: "A2", definition: "Someone who lives near you.", example: "Our neighbour has a big garden.", synonyms: [], antonyms: [] },
  { word: "prepare", cefrLevel: "A2", definition: "To get something ready.", example: "I need to prepare for the test.", synonyms: ["arrange"], antonyms: [] },
  { word: "quiet", cefrLevel: "A2", definition: "Making little or no noise.", example: "The library is very quiet.", synonyms: ["silent"], antonyms: ["noisy"] },
  { word: "receive", cefrLevel: "A2", definition: "To get something that is given or sent to you.", example: "I received your letter yesterday.", synonyms: ["get"], antonyms: ["send"] },
  { word: "repair", cefrLevel: "A2", definition: "To fix something that is broken.", example: "He repaired my bicycle.", synonyms: ["fix", "mend"], antonyms: ["break"] },
  { word: "several", cefrLevel: "A2", definition: "More than two, but not many.", example: "I called her several times.", synonyms: ["a few"], antonyms: [] },
  { word: "suddenly", cefrLevel: "A2", definition: "Quickly and without warning.", example: "Suddenly, the lights went out.", synonyms: ["abruptly"], antonyms: ["gradually"] },
  { word: "travel", cefrLevel: "A2", definition: "To go from one place to another, usually far away.", example: "They travel to Spain every summer.", synonyms: [], antonyms: [] },
  { word: "unusual", cefrLevel: "A2", definition: "Not common or normal.", example: "It is unusual to see snow here.", synonyms: ["rare"], antonyms: ["common"] },
  { word: "visit", cefrLevel: "A2", definition: "To go and see a person or place.", example: "We visit my grandmother on Sundays.", synonyms: [], antonyms: [] },
  { word: "weather", cefrLevel: "A2", definition: "The conditions outside, such as rain, sun or wind.", example: "The weather was terrible all week.", synonyms: [], antonyms: [] },
  { word: "worry", cefrLevel: "A2", definition: "To feel anxious about something.", example: "Do not worry about the exam.", synonyms: ["fret"], antonyms: [] },
  { word: "already", cefrLevel: "A2", definition: "Before now, or earlier than expected.", example: "She has already finished her work.", synonyms: [], antonyms: ["yet"] },
  { word: "comfortable", cefrLevel: "A2", definition: "Pleasant to be in or wear; not causing pain.", example: "These shoes are very comfortable.", synonyms: ["cosy"], antonyms: ["uncomfortable"] },
  { word: "improve", cefrLevel: "A2", definition: "To become better, or to make something better.", example: "My English is improving slowly.", synonyms: ["enhance"], antonyms: ["worsen"] },
  { word: "perhaps", cefrLevel: "A2", definition: "Possibly; used when you are not sure.", example: "Perhaps we should leave now.", synonyms: ["maybe"], antonyms: ["certainly"] },

  // ---------- B1 ----------
  { word: "achieve", cefrLevel: "B1", definition: "To succeed in doing something after effort.", example: "She achieved all her goals this year.", synonyms: ["accomplish", "attain"], antonyms: ["fail"] },
  { word: "advantage", cefrLevel: "B1", definition: "Something that helps you or puts you in a better position.", example: "Speaking two languages is a real advantage.", synonyms: ["benefit"], antonyms: ["disadvantage"] },
  { word: "afford", cefrLevel: "B1", definition: "To have enough money or time for something.", example: "We cannot afford a new car this year.", synonyms: [], antonyms: [] },
  { word: "attitude", cefrLevel: "B1", definition: "The way you think and feel about something.", example: "He has a positive attitude to work.", synonyms: ["outlook"], antonyms: [] },
  { word: "avoid", cefrLevel: "B1", definition: "To stay away from something, or stop it happening.", example: "Try to avoid driving at rush hour.", synonyms: ["evade"], antonyms: ["seek"] },
  { word: "confident", cefrLevel: "B1", definition: "Sure of yourself and your abilities.", example: "She felt confident before the interview.", synonyms: ["self-assured"], antonyms: ["nervous"] },
  { word: "consider", cefrLevel: "B1", definition: "To think carefully about something.", example: "We are considering moving abroad.", synonyms: ["contemplate"], antonyms: [] },
  { word: "convenient", cefrLevel: "B1", definition: "Easy or useful because it saves you trouble.", example: "The flat is convenient for the station.", synonyms: ["handy"], antonyms: ["inconvenient"] },
  { word: "disappointed", cefrLevel: "B1", definition: "Sad because something was not as good as you hoped.", example: "I was disappointed with the film.", synonyms: ["let down"], antonyms: ["pleased"] },
  { word: "encourage", cefrLevel: "B1", definition: "To give someone confidence or support to do something.", example: "My teacher encouraged me to apply.", synonyms: ["motivate"], antonyms: ["discourage"] },
  { word: "essential", cefrLevel: "B1", definition: "Completely necessary.", example: "Sleep is essential for good health.", synonyms: ["vital", "crucial"], antonyms: ["optional"] },
  { word: "expect", cefrLevel: "B1", definition: "To think that something will happen.", example: "We expect the results on Friday.", synonyms: ["anticipate"], antonyms: [] },
  { word: "experience", cefrLevel: "B1", definition: "Knowledge or skill gained by doing something; or an event you live through.", example: "She has ten years of experience in teaching.", synonyms: [], antonyms: [] },
  { word: "familiar", cefrLevel: "B1", definition: "Well known to you.", example: "His face looked familiar.", synonyms: ["recognisable"], antonyms: ["unfamiliar"] },
  { word: "generation", cefrLevel: "B1", definition: "All the people born at about the same time.", example: "My grandparents' generation lived very differently.", synonyms: [], antonyms: [] },
  { word: "identify", cefrLevel: "B1", definition: "To recognise or name what something is.", example: "Can you identify the problem?", synonyms: ["recognise"], antonyms: [] },
  { word: "manage", cefrLevel: "B1", definition: "To succeed in doing something difficult; or to be in charge of something.", example: "He managed to finish on time.", synonyms: ["handle"], antonyms: [] },
  { word: "opportunity", cefrLevel: "B1", definition: "A chance to do something good.", example: "This job is a great opportunity.", synonyms: ["chance"], antonyms: [] },
  { word: "opinion", cefrLevel: "B1", definition: "What you think about something.", example: "In my opinion, the plan will not work.", synonyms: ["view"], antonyms: ["fact"] },
  { word: "prefer", cefrLevel: "B1", definition: "To like one thing more than another.", example: "I prefer tea to coffee.", synonyms: [], antonyms: [] },
  { word: "pressure", cefrLevel: "B1", definition: "A feeling of stress caused by demands on you.", example: "Students are under a lot of pressure.", synonyms: ["stress"], antonyms: [] },
  { word: "realise", cefrLevel: "B1", definition: "To become aware of something.", example: "I did not realise how late it was.", synonyms: ["recognise"], antonyms: [] },
  { word: "reduce", cefrLevel: "B1", definition: "To make something smaller in size or amount.", example: "We must reduce our costs.", synonyms: ["decrease", "lower"], antonyms: ["increase"] },
  { word: "reliable", cefrLevel: "B1", definition: "Able to be trusted to do what is needed.", example: "She is a reliable employee.", synonyms: ["dependable"], antonyms: ["unreliable"] },
  { word: "responsible", cefrLevel: "B1", definition: "Having a duty to deal with something; or being the cause of it.", example: "You are responsible for your own work.", synonyms: ["accountable"], antonyms: ["irresponsible"] },
  { word: "situation", cefrLevel: "B1", definition: "The set of conditions at a particular time.", example: "The situation is getting better.", synonyms: ["circumstances"], antonyms: [] },
  { word: "suggest", cefrLevel: "B1", definition: "To offer an idea or plan for others to consider.", example: "I suggest we meet on Tuesday.", synonyms: ["propose", "recommend"], antonyms: [] },
  { word: "support", cefrLevel: "B1", definition: "To help someone or agree with an idea.", example: "My family supported my decision.", synonyms: ["back", "assist"], antonyms: ["oppose"] },
  { word: "prevent", cefrLevel: "B1", definition: "To stop something from happening.", example: "Regular checks prevent serious problems.", synonyms: ["stop", "avert"], antonyms: ["allow"] },
  { word: "waste", cefrLevel: "B1", definition: "To use something badly so that it is not needed or useful.", example: "Do not waste your time on this.", synonyms: ["squander"], antonyms: ["save"] },

  // ---------- B2 ----------
  { word: "acknowledge", cefrLevel: "B2", definition: "To accept or admit that something is true.", example: "He acknowledged that he had made a mistake.", synonyms: ["admit", "concede"], antonyms: ["deny"] },
  { word: "adapt", cefrLevel: "B2", definition: "To change so that you fit a new situation.", example: "Children adapt quickly to a new school.", synonyms: ["adjust"], antonyms: [] },
  { word: "assume", cefrLevel: "B2", definition: "To believe something is true without proof.", example: "Do not assume the meeting is cancelled.", synonyms: ["presume"], antonyms: ["verify"] },
  { word: "beneficial", cefrLevel: "B2", definition: "Having a good effect.", example: "Regular exercise is beneficial to health.", synonyms: ["advantageous"], antonyms: ["harmful"] },
  { word: "considerable", cefrLevel: "B2", definition: "Large in amount or importance.", example: "The project required considerable effort.", synonyms: ["substantial"], antonyms: ["negligible"] },
  { word: "contribute", cefrLevel: "B2", definition: "To give something, such as money, ideas or effort, to help.", example: "Everyone contributed to the discussion.", synonyms: [], antonyms: [] },
  { word: "controversial", cefrLevel: "B2", definition: "Causing strong disagreement.", example: "The decision proved highly controversial.", synonyms: ["contentious"], antonyms: ["uncontroversial"] },
  { word: "demonstrate", cefrLevel: "B2", definition: "To show clearly that something is true, or how it works.", example: "The study demonstrates a clear link.", synonyms: ["show", "prove"], antonyms: [] },
  { word: "distinguish", cefrLevel: "B2", definition: "To recognise the difference between things.", example: "It is hard to distinguish the two species.", synonyms: ["differentiate"], antonyms: ["confuse"] },
  { word: "efficient", cefrLevel: "B2", definition: "Working well without wasting time or resources.", example: "The new system is far more efficient.", synonyms: ["effective"], antonyms: ["inefficient"] },
  { word: "emphasise", cefrLevel: "B2", definition: "To give special importance to something.", example: "She emphasised the need for care.", synonyms: ["stress", "highlight"], antonyms: ["downplay"] },
  { word: "establish", cefrLevel: "B2", definition: "To start something that will last; or to prove something.", example: "The company was established in 1920.", synonyms: ["found"], antonyms: [] },
  { word: "evidence", cefrLevel: "B2", definition: "Facts or signs that show whether something is true.", example: "There is little evidence for that claim.", synonyms: ["proof"], antonyms: [] },
  { word: "gradually", cefrLevel: "B2", definition: "Slowly, over a period of time.", example: "The pain gradually disappeared.", synonyms: ["steadily"], antonyms: ["suddenly"] },
  { word: "implement", cefrLevel: "B2", definition: "To put a plan or decision into action.", example: "The school implemented a new policy.", synonyms: ["carry out"], antonyms: [] },
  { word: "impact", cefrLevel: "B2", definition: "A strong effect on something.", example: "The law had a major impact on farmers.", synonyms: ["effect", "influence"], antonyms: [] },
  { word: "inevitable", cefrLevel: "B2", definition: "Certain to happen and impossible to avoid.", example: "Some delay is inevitable.", synonyms: ["unavoidable"], antonyms: ["avoidable"] },
  { word: "justify", cefrLevel: "B2", definition: "To give a good reason for something.", example: "How do you justify that expense?", synonyms: ["defend"], antonyms: [] },
  { word: "maintain", cefrLevel: "B2", definition: "To keep something at the same level; or to state firmly.", example: "It is difficult to maintain that pace.", synonyms: ["sustain"], antonyms: [] },
  { word: "moreover", cefrLevel: "B2", definition: "In addition; used to add a further point.", example: "The plan is costly. Moreover, it is risky.", synonyms: ["furthermore"], antonyms: [] },
  { word: "obvious", cefrLevel: "B2", definition: "Easy to see or understand.", example: "The answer was obvious to everyone.", synonyms: ["evident", "apparent"], antonyms: ["unclear"] },
  { word: "potential", cefrLevel: "B2", definition: "Possible in the future; or the ability to develop.", example: "The idea has real potential.", synonyms: ["possibility"], antonyms: [] },
  { word: "reluctant", cefrLevel: "B2", definition: "Unwilling and hesitating.", example: "He was reluctant to answer.", synonyms: ["unwilling", "hesitant"], antonyms: ["eager"] },
  { word: "significant", cefrLevel: "B2", definition: "Important or large enough to matter.", example: "There was a significant rise in prices.", synonyms: ["notable", "considerable"], antonyms: ["insignificant"] },
  { word: "sufficient", cefrLevel: "B2", definition: "As much as is needed.", example: "We do not have sufficient data.", synonyms: ["adequate", "enough"], antonyms: ["insufficient"] },
  { word: "tendency", cefrLevel: "B2", definition: "A likelihood of behaving in a particular way.", example: "He has a tendency to exaggerate.", synonyms: ["inclination"], antonyms: [] },
  { word: "thorough", cefrLevel: "B2", definition: "Complete, with attention to every detail.", example: "They carried out a thorough investigation.", synonyms: ["comprehensive"], antonyms: ["superficial"] },
  { word: "widespread", cefrLevel: "B2", definition: "Existing or happening over a large area or among many people.", example: "The belief is widespread but mistaken.", synonyms: ["prevalent"], antonyms: ["rare"] },
  { word: "assess", cefrLevel: "B2", definition: "To judge the quality, value or importance of something.", example: "We need to assess the risks first.", synonyms: ["evaluate"], antonyms: [] },
  { word: "consequence", cefrLevel: "B2", definition: "A result of an action, especially an unwelcome one.", example: "He did not consider the consequences.", synonyms: ["result", "outcome"], antonyms: ["cause"] },

  // ---------- C1 ----------
  { word: "ambiguous", cefrLevel: "C1", definition: "Having more than one possible meaning, and so unclear.", example: "The wording of the contract is ambiguous.", synonyms: ["unclear", "equivocal"], antonyms: ["unambiguous"] },
  { word: "coherent", cefrLevel: "C1", definition: "Clear, logical and well organised.", example: "She presented a coherent argument.", synonyms: ["logical", "consistent"], antonyms: ["incoherent"] },
  { word: "compelling", cefrLevel: "C1", definition: "So convincing or interesting that it holds your attention.", example: "He made a compelling case for reform.", synonyms: ["persuasive"], antonyms: ["weak"] },
  { word: "comprehensive", cefrLevel: "C1", definition: "Including everything that is relevant.", example: "The report offers a comprehensive overview.", synonyms: ["thorough", "exhaustive"], antonyms: ["partial"] },
  { word: "conversely", cefrLevel: "C1", definition: "Used to introduce the opposite of what has just been said.", example: "Rural areas emptied; conversely, cities grew.", synonyms: ["on the other hand"], antonyms: [] },
  { word: "crucial", cefrLevel: "C1", definition: "Extremely important because other things depend on it.", example: "Timing is crucial in negotiations.", synonyms: ["critical", "pivotal"], antonyms: ["trivial"] },
  { word: "diminish", cefrLevel: "C1", definition: "To become or make less.", example: "Her influence gradually diminished.", synonyms: ["decrease", "wane"], antonyms: ["increase"] },
  { word: "discrepancy", cefrLevel: "C1", definition: "A difference between things that should be the same.", example: "There is a discrepancy between the two accounts.", synonyms: ["inconsistency"], antonyms: ["agreement"] },
  { word: "explicit", cefrLevel: "C1", definition: "Stated clearly and directly, leaving no doubt.", example: "She gave explicit instructions.", synonyms: ["clear", "unequivocal"], antonyms: ["implicit"] },
  { word: "feasible", cefrLevel: "C1", definition: "Possible to do in practice.", example: "The plan is ambitious but feasible.", synonyms: ["viable", "practicable"], antonyms: ["unfeasible"] },
  { word: "implication", cefrLevel: "C1", definition: "A likely consequence, or something suggested without being said.", example: "The findings have serious implications for policy.", synonyms: ["consequence"], antonyms: [] },
  { word: "inherent", cefrLevel: "C1", definition: "Existing as a natural and permanent part of something.", example: "There are risks inherent in any investment.", synonyms: ["intrinsic"], antonyms: ["acquired"] },
  { word: "nevertheless", cefrLevel: "C1", definition: "In spite of what has just been said.", example: "The evidence is thin; nevertheless, the idea is worth testing.", synonyms: ["nonetheless"], antonyms: [] },
  { word: "notion", cefrLevel: "C1", definition: "An idea or belief, often a vague one.", example: "He rejected the notion that talent is fixed.", synonyms: ["idea", "concept"], antonyms: [] },
  { word: "plausible", cefrLevel: "C1", definition: "Seeming reasonable or probably true.", example: "That is a plausible explanation.", synonyms: ["credible", "believable"], antonyms: ["implausible"] },
  { word: "predominantly", cefrLevel: "C1", definition: "Mainly; for the most part.", example: "The audience was predominantly young.", synonyms: ["mainly", "chiefly"], antonyms: [] },
  { word: "profound", cefrLevel: "C1", definition: "Very great, or showing deep understanding.", example: "The war had a profound effect on the region.", synonyms: ["deep", "far-reaching"], antonyms: ["superficial"] },
  { word: "prone", cefrLevel: "C1", definition: "Likely to suffer from or do something undesirable.", example: "The system is prone to error.", synonyms: ["liable", "susceptible"], antonyms: ["resistant"] },
  { word: "scrutiny", cefrLevel: "C1", definition: "Careful and critical examination.", example: "The proposal did not survive close scrutiny.", synonyms: ["examination"], antonyms: [] },
  { word: "subsequent", cefrLevel: "C1", definition: "Coming after something in time.", example: "Subsequent studies confirmed the result.", synonyms: ["following", "later"], antonyms: ["previous"] },
  { word: "substantial", cefrLevel: "C1", definition: "Large in amount, value or importance.", example: "They made a substantial contribution.", synonyms: ["considerable"], antonyms: ["slight"] },
  { word: "undermine", cefrLevel: "C1", definition: "To weaken something gradually.", example: "The scandal undermined public trust.", synonyms: ["weaken", "erode"], antonyms: ["strengthen"] },
  { word: "underlying", cefrLevel: "C1", definition: "Real but not immediately obvious; forming the basis of something.", example: "We must address the underlying causes.", synonyms: ["fundamental"], antonyms: ["superficial"] },
  { word: "constitute", cefrLevel: "C1", definition: "To be or form part of something; to make up.", example: "These changes constitute a major reform.", synonyms: ["comprise", "form"], antonyms: [] },
  { word: "yield", cefrLevel: "C1", definition: "To produce a result; or to give way.", example: "The experiment yielded surprising results.", synonyms: ["produce", "generate"], antonyms: [] },

  // ---------- C2 ----------
  { word: "arguably", cefrLevel: "C2", definition: "Used to say something can be argued, though not proved.", example: "She is arguably the finest writer of her generation.", synonyms: ["possibly"], antonyms: ["indisputably"] },
  { word: "cursory", cefrLevel: "C2", definition: "Done quickly and without attention to detail.", example: "A cursory glance revealed several errors.", synonyms: ["superficial", "perfunctory"], antonyms: ["thorough"] },
  { word: "delineate", cefrLevel: "C2", definition: "To describe or mark the boundaries of something precisely.", example: "The paper delineates three distinct phases.", synonyms: ["outline", "define"], antonyms: [] },
  { word: "efficacy", cefrLevel: "C2", definition: "The ability of something to produce the intended result.", example: "Trials questioned the efficacy of the drug.", synonyms: ["effectiveness"], antonyms: [] },
  { word: "entrenched", cefrLevel: "C2", definition: "Firmly established and very difficult to change.", example: "These attitudes are deeply entrenched.", synonyms: ["ingrained"], antonyms: ["fleeting"] },
  { word: "extrapolate", cefrLevel: "C2", definition: "To estimate something unknown by extending known information.", example: "We should not extrapolate from a single case.", synonyms: ["infer"], antonyms: [] },
  { word: "innocuous", cefrLevel: "C2", definition: "Harmless; unlikely to cause offence.", example: "It seemed an innocuous remark at the time.", synonyms: ["harmless", "benign"], antonyms: ["harmful"] },
  { word: "juxtapose", cefrLevel: "C2", definition: "To place things side by side to show contrast.", example: "The essay juxtaposes wealth and poverty.", synonyms: ["contrast"], antonyms: [] },
  { word: "nuance", cefrLevel: "C2", definition: "A very slight difference in meaning, feeling or tone.", example: "The translation loses much of the nuance.", synonyms: ["subtlety"], antonyms: [] },
  { word: "ostensibly", cefrLevel: "C2", definition: "Apparently, but perhaps not really.", example: "He resigned, ostensibly for personal reasons.", synonyms: ["apparently", "seemingly"], antonyms: ["genuinely"] },
  { word: "paradigm", cefrLevel: "C2", definition: "A typical example or model of how something works.", example: "The discovery challenged the dominant paradigm.", synonyms: ["model", "framework"], antonyms: [] },
  { word: "pervasive", cefrLevel: "C2", definition: "Present and noticeable throughout something.", example: "Corruption was pervasive at every level.", synonyms: ["widespread"], antonyms: ["confined"] },
  { word: "preclude", cefrLevel: "C2", definition: "To prevent something from happening.", example: "Lack of funding precludes further research.", synonyms: ["prevent", "rule out"], antonyms: ["permit"] },
  { word: "tenuous", cefrLevel: "C2", definition: "Very weak or slight; easily doubted.", example: "The connection between the two is tenuous.", synonyms: ["flimsy", "weak"], antonyms: ["strong"] },
  { word: "ubiquitous", cefrLevel: "C2", definition: "Seeming to be everywhere at once.", example: "Smartphones have become ubiquitous.", synonyms: ["omnipresent"], antonyms: ["scarce"] },
];

// Imported here (after the interface) so the Chinese list can reference the
// shared entry type; the import is value-level but there is no cycle because
// chinese/wordlist.ts imports only the type.
import { CHINESE_WORDLIST } from "../chinese/wordlist";

function catalogFor(language: TargetLanguage): WordlistEntry[] {
  return language === "chinese" ? CHINESE_WORDLIST : WORDLIST;
}

/** Curated entries for a language, optionally filtered to one CEFR level. */
export function listWordlist(
  level?: CefrLevel,
  language: TargetLanguage = "english",
): WordlistEntry[] {
  const catalog = catalogFor(language);
  return level ? catalog.filter((e) => e.cefrLevel === level) : catalog;
}

/** Looks up a curated entry by word across every language.
 * Chinese words are 汉字 and English words are latin, so they cannot collide --
 * which lets lookups stay language-agnostic (the Stage 28 rule). */
export function getWordlistEntry(word: string): WordlistEntry | undefined {
  const normalized = word.trim().toLowerCase();
  return (
    WORDLIST.find((e) => e.word === normalized) ??
    CHINESE_WORDLIST.find((e) => e.word === normalized)
  );
}

/** The CEFR level of a curated word, or undefined if it isn't in any list. */
export function wordlistLevelOf(word: string): CefrLevel | undefined {
  return getWordlistEntry(word)?.cefrLevel;
}

export const WORDLIST_SIZE = WORDLIST.length;
export const CHINESE_WORDLIST_SIZE = CHINESE_WORDLIST.length;
