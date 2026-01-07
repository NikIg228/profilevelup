You are implementing the frontend logic for a personality testing system.

IMPORTANT:
- All test logic must live on the frontend
- Backend receives ONLY the final resultIndex (string)
- Backend does NOT calculate anything

=====================================
1. GENERAL CONCEPT
=====================================

There are multiple tests grouped by:
- tariff (FREE / PRO / PREMIUM)
- age group (e.g. 13-17, 18-24, 25-34, 35-45)
- gender (male / female)

For now, implement ONLY tests from tariff = FREE.

Each test:
- consists of exactly 5 questions
- each question directly returns a LETTER (not a/b)
- the final result is a 4-letter code

=====================================
2. QUESTIONS → LETTERS
=====================================

Question mapping is fixed:

Q1 → returns "P" or "J"
Q2 → returns "E" or "I"
Q3 → returns "T" or "F"
Q4 → returns "J" or "P"
Q5 → returns "N" or "S"

The frontend must store answers as:
answers = { [questionId]: letter }

=====================================
3. FINAL RESULT FORMAT
=====================================

Final personality type MUST be built in this strict order:

[E/I] – [N/S] – [T/F] – [J/P/W]

The order of questions DOES NOT equal the order of letters.

=====================================
4. RESULT BUILDING RULES
=====================================

Letter positions:

Position 1 (E/I) → from question 2
Position 2 (N/S) → from question 5
Position 3 (T/F) → from question 3
Position 4 (J/P/W) → resolved from questions 1 and 4

JPW resolution rules:
- if answer_q1 === answer_q4 → use that letter (J or P)
- if answer_q1 !== answer_q4 → use "W"

"W" is a valid final type and represents a conflict between strategies.

=====================================
5. ALGORITHM (MANDATORY)
=====================================

answers = {
  1: "P" | "J",
  2: "E" | "I",
  3: "T" | "F",
  4: "J" | "P",
  5: "N" | "S"
}

function resolveJPW(a1, a4) {
  if (a1 === a4) return a1;
  return "W";
}

finalResult =
  answers[2] +
  answers[5] +
  answers[3] +
  resolveJPW(answers[1], answers[4])

=====================================
6. FRONTEND ARCHITECTURE (REQUIRED)
=====================================

Use this exact structure:

/src
  /tests
    /FREE
      /13-17
        male.ts
        female.ts
      /18-24
        male.ts
        female.ts
      /25-34
        male.ts
        female.ts
      /35-45
        male.ts
        female.ts

  /engine
    types.ts
    resolveJPW.ts
    resolveResult.ts
    getTestConfig.ts

=====================================
7. TEST FILE RULES
=====================================

Each test file must:
- export a TestConfig object
- contain ONLY:
  - meta (tariff, age, gender)
  - questions (text + options with letters)
  - resultMapping (same for all FREE tests)

NO logic inside test files.

=====================================
8. ENGINE RULES
=====================================

- resolveResult.ts must be universal
- logic must NOT depend on age, gender, or tariff
- adding a new test must require ONLY adding a new test file

=====================================
9. OUTPUT REQUIREMENTS
=====================================

Implement:
1) All FREE tests as config files
2) Universal engine to calculate resultIndex
3) A selector function to load correct test by tariff/age/gender

DO NOT:
- hardcode results
- use if/else in UI
- duplicate logic
- move logic to backend

The frontend must output:
resultIndex: string (example: "ESTW")
