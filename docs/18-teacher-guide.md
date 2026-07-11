# Teacher Guide

For teachers using the desktop app's teacher dashboard.

## Logging in

Your account is created either by the school admin or by another teacher (there's no self-registration — see `docs/17-admin-guide.md`). Logging in takes you to the teacher dashboard: a class list on the left, class details on the right.

## Classes and rosters

- **Create a class** — enter a name in the sidebar and click Create. You can have multiple classes; each is independent (its own roster, assignments, and reports).
- **Add students** — select a class, then use the roster panel's form to add a student by email/display name/initial password. This both creates the student's login and enrolls them in the class in one step — you don't need to create the account separately through an admin first.
- **View a student's progress** — click any student's row in the roster to see their individual progress (the same analytics view students see for themselves — grammar weaknesses, vocabulary growth, practice frequency, estimated CEFR level).

## Assignments

Create an assignment for a class: a title, description, a conversation scenario (Free Talk, Role Play, Interview Practice, Business English, Travel English, Daily Conversation, or Debate Practice), and a due date. Assignments show up for students to start from their own conversation screen; whether a given student has completed an assignment is tracked automatically based on whether they've had a conversation using that assignment's scenario.

## Reviewing grammar mistakes

The mistakes table on a class's page lists grammar mistakes flagged across every student's conversations in that class — original text, the correction, and which grammar rule was involved. This is read-only review; the actual correction and "explain this mistake" AI tutoring happens live for the student inside their own conversation.

## Reports

Two export buttons generate a report for the currently selected class:

- **CSV** — raw data, useful for importing into a spreadsheet or your school's own gradebook system.
- **PDF** — a formatted, printable report.

Both are generated locally — no data leaves the machine.

## What teachers can't do (by design)

- Teachers can't see or modify other teachers' classes — every class, roster, and report is scoped to the teacher who created it.
- Teachers can't create other teacher accounts or access the system-health/backup/AI-model admin tools — those are admin-only (`docs/17-admin-guide.md`). If you need a colleague's account created or a system backup taken, ask your school's admin.
