---
name: execution-governor
description: Govern implementation from an approved execution contract. Invoke when `execution-contract.md` is approved and the user wants disciplined build work, TDD execution, or guarded batch-by-batch implementation.
---

# Execution Governor

This skill controls the implementation phase of `spec-superflow`.

It borrows the spirit of Superpowers execution discipline, but uses `execution-contract.md` as the workflow authority.

## Use This Skill When

Invoke this skill when the user says things like:

- "implement this now"
- "start coding"
- "execute batch 1"
- "continue implementation"
- "finish the build work"

Only use it after the contract exists and the user has approved it.

## Required Inputs

Read before implementation:

- `execution-contract.md`
- `tasks.md`
- relevant `specs/`
- relevant `design.md`

## Core Laws

### Law 1: Contract First

Do not treat chat history as the source of truth once implementation begins.

The execution contract is the approved handoff artifact.

### Law 2: No Production Code Without a Failing Test First (TDD Iron Law)

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

This is not a preference. It is the execution discipline.

**The RED-GREEN-REFACTOR Cycle:**

| Phase | Action | Evidence Required |
|-------|--------|-------------------|
| **RED** | Write the failing test | Run it, see it fail for the expected reason |
| **GREEN** | Write minimal production code | Run test, see it pass (and all others still pass) |
| **REFACTOR** | Clean up code while tests stay green | Full suite still passing after cleanup |

**Red Flags — STOP and return to RED:**

If you catch yourself thinking any of these, you are violating the TDD Iron Law:

- "Just a quick implementation first, test later"
- "This is simple enough, I'll test after"
- "Let me write the code and the tests together"
- "Skip the test, I'll manually verify"
- "The test setup is complex, let me just code it"
- "I already know it works, testing is redundant"
- "Just this one time without tests"
- "The implementation will inform the test design" (it won't — it will validate whatever you built)

**ALL of these mean: STOP. Write the test first.**

### Law 3: Review Before Drift

Use review gates between meaningful execution batches.

Block progress on:

- logic defects
- spec violations
- missing required tests
- unintended scope expansion

### Law 4: Rewind on Contract Break

Return to `specifying` or `bridging` if:

- new behavior appears
- interfaces change materially
- design assumptions fail
- the current artifacts no longer define the intended implementation

## Subagent-Driven Development (SDD) Workflow

For changes with more than one execution batch, use the SDD workflow: dispatch a fresh implementer subagent per task, review each task (spec compliance + code quality), and conduct a broad final review after all tasks are complete.

### Pre-Flight Plan Review

Before dispatching Task 1, scan the execution contract and tasks for conflicts:

- Tasks that contradict each other or the contract's intent lock
- Anything the spec explicitly mandates that the review rubric treats as a defect
- Present all findings to the user as one batched question before execution begins

If the scan is clean, proceed without comment.

### Model Selection Strategy

Use the least powerful model that can handle each role:

- **Mechanical implementation** (isolated functions, clear specs, 1-2 files): use a fast, cheap model
- **Integration and judgment** (multi-file coordination, pattern matching, debugging): use a standard model
- **Architecture and design** (requires broad codebase understanding or design judgment): use the most capable model
- **Review tasks**: match the model to the diff's size, complexity, and risk
- **Final whole-branch review**: use the most capable model

**Always specify the model explicitly when dispatching a subagent.** An omitted model inherits the session's model, defeating cost optimization.

### Per-Task Loop

For each task in the execution batch:

1. **Dispatch implementer**: Use the template at `implementer-prompt.md` to craft the dispatch. Run `scripts/task-brief PLAN_FILE N` to extract the task brief to a file. Compose the dispatch prompt with: (a) where this task fits, (b) the brief path, (c) interfaces/decisions from prior tasks, (d) report file path.
2. **Handle implementer response**:
   - **DONE**: Generate review package with `scripts/review-package BASE HEAD` and dispatch task reviewer
   - **DONE_WITH_CONCERNS**: Read concerns, assess, then review
   - **NEEDS_CONTEXT**: Provide missing context, re-dispatch
   - **BLOCKED**: Assess blocker — if task requires more reasoning, re-dispatch with better model; if plan is wrong, escalate to user
3. **Review**: Dispatch task reviewer using `task-reviewer-prompt.md`. Reviewer returns spec compliance verdict + code quality verdict.
4. **Fix**: If Critical or Important issues found, dispatch fix subagent. Re-review after fixes.
5. **Mark complete**: Append one line to `.superpowers/sdd/progress.md`: `Task N: complete (commits <base7>..<head7>, review clean)`

### File Handoffs

Keep your context lean by handing artifacts as files, not pasted text:

- **Task brief**: `scripts/task-brief PLAN_FILE N` — extracts task text to a uniquely named file
- **Report file**: Named after the brief (`task-N-report.md`) — implementer writes full report there, returns only status summary
- **Review package**: `scripts/review-package BASE HEAD` — writes diff to a unique file; reviewer reads one file instead of running git commands

### Progress Ledger

Track progress in `.superpowers/sdd/progress.md`. At skill start, check for an existing ledger — tasks marked complete there are done, do not re-dispatch them. After each clean review, append one line to the ledger.

The ledger survives context compaction. If `git clean -fdx` destroys it, recover from `git log`.

### Dispatch Instructions for Implementer Subagents

Refer to `implementer-prompt.md` for the complete dispatch template. Key principles:

- Subagent works from its task brief, not the whole plan
- Subagent follows TDD (the rules embedded in this execution-governor)
- Subagent self-reviews before reporting back
- Subagent escalates when stuck (BLOCKED, NEEDS_CONTEXT) rather than guessing
- Subagent writes its full report to the report file, returns only status summary

### Dispatch Instructions for Reviewer Subagents

Refer to `task-reviewer-prompt.md` for the complete dispatch template. Key principles:

- Reviewer gets the task brief, the implementer's report, and the diff file — nothing more
- Reviewer does NOT trust the implementer's report; it verifies against the diff
- Reviewer returns two verdicts: spec compliance and code quality
- Reviewer's output is the report itself — no preamble, no process narration

### Handling Reviewer ⚠️ Items

The task reviewer may report "⚠️ Cannot verify from diff" items — requirements in unchanged code or spanning tasks. Resolve each yourself before marking the task complete. If real gaps, treat as failed spec review — send back to implementer and re-review.

## Execution Modes

### Small changes (single batch)

Execute in a focused serial path with explicit batch completion checks. Follow TDD directly without subagent dispatch.

### Larger changes (multiple batches)

Use the SDD workflow: dispatch per-task implementers, review after each task, broad review after all batches.

## Progress Reporting

During implementation, keep reporting against the contract:

- which batch is active
- which test or verification step is next
- whether scope drift has appeared

If drift appears, stop and route backward instead of improvising new behavior.

## Completion Standard

Do not report completion until:

- required tests pass
- contract obligations are satisfied
- review blockers are resolved
- all batches have been reviewed (per-task reviews + broad final review)
- the workflow is ready for `closure-archivist`
