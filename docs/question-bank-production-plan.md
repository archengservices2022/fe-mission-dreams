# Question Bank Production Plan

FE Mission Dreams should not enable a full 110-question exam simulator for a discipline until that discipline has enough reviewed content to sample fairly across the published topic weights.

## Targets

- Minimum launch bank: 150 verified questions per discipline
- Strong bank: 250 verified questions per discipline
- Full product scope: 7 FE disciplines x 150-250 questions = 1,050-1,750 verified questions

## Disciplines

- FE Civil
- FE Mechanical
- FE Electrical & Computer
- FE Environmental
- FE Chemical
- FE Industrial & Systems
- FE Other Disciplines

## Question Standard

Every production question should include:

- Stable question id
- Discipline, subject, and section
- Skill tag
- Difficulty: Easy, Medium, or Hard
- Multiple choice or numeric answer type
- Correct answer and grading tolerance when numeric
- Full step-by-step solution
- Short explanation
- Trap explanation
- Repair instruction
- Formula used when relevant
- Estimated solving time
- Common mistake categories
- FE Reference Handbook keywords

## Batch Strategy

Build in batches of 25 questions:

1. Pick one discipline.
2. Pick the highest-weight unfinished subjects first.
3. Add 5-8 questions per selected section.
4. Keep a mix of easy, medium, and hard questions.
5. Validate with lint, typecheck, and build.
6. Review questions for answer accuracy before marking a section ready.

## Recommended Build Order

1. FE Civil: structural, geotechnical, water/environmental, transportation, construction
2. FE Mechanical: deepen existing modules until the bank reaches 250
3. FE Electrical & Computer: circuits, power, electronics, controls, digital systems
4. FE Environmental: water/wastewater, air, solid/hazardous waste, hydrology
5. FE Other Disciplines: broad general engineering review
6. FE Chemical: material balances, thermodynamics, transport, reactions
7. FE Industrial & Systems: probability/statistics, quality, engineering economics, operations

## Full Exam Gate

Enable the full 110-question exam simulator only when:

- The selected discipline has at least 150 verified questions.
- At least 70% of published sections have connected modules.
- The sampler can weight questions by subject range.
- The result report breaks down score by subject, section, skill, mistake category, and response time.
