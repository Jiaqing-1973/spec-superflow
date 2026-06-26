---
name: spec-forger
description: Create or refine spec-superflow planning artifacts. Invoke when the change is understood well enough to write `proposal.md`, `specs/`, `design.md`, and `tasks.md`.
---

# Spec Forger

Use this skill when the change has moved beyond exploration and is ready to become concrete artifacts.

## Use This Skill When

Invoke this skill when the user says things like:

- "write the proposal"
- "turn this into specs"
- "create the design doc"
- "break the work into tasks"
- "formalize the plan"

## Required Artifacts

Create or refine:

- `proposal.md`
- `specs/`
- `design.md`
- `tasks.md`

Use OpenSpec-style artifact roles:

- `proposal.md` defines why and scope
- `specs/` define required behavior
- `design.md` defines how and why at the architecture level
- `tasks.md` defines dependency-aware implementation steps

## Working Rules

### `proposal.md`

Must clearly state:

- the problem
- what changes
- capabilities affected
- impact areas

### `specs/`

Must be testable.

Every requirement should be written so that a later test can prove it.

### `design.md`

Must explain architectural decisions and trade-offs, not line-by-line implementation.

### `tasks.md`

Must be ordered, verifiable, and small enough to become execution batches later.

**Granularity requirement**: Each task MUST be small enough that a developer can complete it in 2-5 minutes of focused work. This means:

- A task is one atomic operation: write one function, add one test case, update one config value
- A task is NOT "implement the authentication module" — that's a batch of tasks
- If a task takes longer than 5 minutes to describe, it should be decomposed further

**No placeholders**: Tasks MUST NOT contain "TBD", "TODO", "figure out later", or similar placeholder language. Every task must be concrete and immediately actionable. If there's uncertainty, resolve it during specification — do not push it to implementation.

### Task Dependency Ordering

Tasks must be ordered so that:

- Each task depends only on tasks listed before it
- No task references work that hasn't been described yet
- The dependency chain is explicit: "Depends on: Task 2.3"

## Quality Bar

The artifact set must be internally aligned:

- `proposal.md` sets scope
- `specs/` define observable behavior
- `design.md` explains the chosen technical shape
- `tasks.md` converts that shape into execution order

If any artifact cannot support the others, revise before handoff.

## Schema Validation

After creating or modifying any artifact, run these validation checks. Do not hand off broken artifacts.

### `proposal.md` Validation

- [ ] Has `## Why` section with > 50 characters of problem description
- [ ] Has `## What Changes` section listing concrete changes
- [ ] Has `## Scope` with `### In Scope` and `### Out of Scope` sub-sections
- [ ] Has `## Impact` section listing affected code areas, APIs, and dependencies
- [ ] Has `## Capabilities` section (New Capabilities and Modified Capabilities)
- [ ] No TBD/TODO/placeholder language in any section

### `specs/` Validation

- [ ] Every requirement uses SHALL or MUST (no "should", "may" for required behavior)
- [ ] Every requirement has at least one `#### Scenario:` with WHEN/THEN clauses
- [ ] Requirements are grouped under ADDED, MODIFIED, or REMOVED headers
- [ ] Each scenario is independently testable
- [ ] No requirement contradicts another requirement

### `design.md` Validation

- [ ] Has `## Context` section describing current state, constraints, stakeholders
- [ ] Has `## Goals` section stating what the design must achieve
- [ ] Has `## Decisions` section with at least one decision (Choice + Rationale + Alternatives)
- [ ] Has `## Risks And Trade-Offs` section
- [ ] Architectural decisions are justified with trade-off analysis

### `tasks.md` Validation

- [ ] Tasks are numbered (1.1, 1.2, 2.1, etc.)
- [ ] Each task is testable (can answer "how do I know this is done?")
- [ ] Tasks are dependency-ordered (each task depends only on earlier tasks)
- [ ] Each task is small enough for 2-5 min of focused work
- [ ] No TBD, TODO, or placeholder language in any task
- [ ] Every requirement from `specs/` maps to at least one task

## Quality Gate

**If any artifact fails validation, fix it before handing off to `bridge-contract`.**

Do not hand off broken artifacts. The validation checks above are not advisory — they are the minimum bar for the next stage to function. If you skip validation, the bridge-contract will produce a contract with holes, and execution will drift.

## Self-Review Checklist

Before handing off:

- [ ] Remove all placeholders — no "TBD", "TODO", "we'll figure it out"
- [ ] Resolve all contradictions — no requirement conflicts with another
- [ ] Ensure tasks align with specs — every requirement has a corresponding task
- [ ] Ensure design supports the required behavior — constraints don't block requirements
- [ ] Run schema validation on all four artifacts — all checks pass
- [ ] Verify task granularity — each task is 2-5 min, atomic, and concretely actionable

## Handoff Rule

Do not start implementation after writing planning artifacts.

Once the artifacts are stable and validated, hand off to `bridge-contract`.

## Output Standard

When handing off, report:

1. which artifacts were created or modified
2. validation results (pass/fail for each artifact)
3. a one-sentence summary of what the change does
