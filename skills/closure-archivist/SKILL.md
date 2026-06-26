---
name: closure-archivist
description: Close out a spec-superflow change with verification, summary, and archive readiness. Invoke when implementation is complete, verification is underway, or the user asks for a final wrap-up.
---

# Closure Archivist

Use this skill to finish a `spec-superflow` change cleanly.

## Use This Skill When

Invoke this skill when the user says things like:

- "wrap this up"
- "give me the final summary"
- "is this ready to close"
- "what remains before we ship"
- "prepare the handoff"

## The Iron Law: Verification Before Completion

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

Claiming work is complete without verification is dishonesty, not efficiency.

**Violating the letter of this rule is violating the spirit of this rule.**

If you haven't run the verification command in this session, you cannot claim anything passes.

### The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

### Forbidden Words

These words MUST NOT appear in your output until AFTER verification evidence is presented:

- "should" (as in "tests should pass")
- "probably" (as in "it probably works")
- "seems to" (as in "it seems to be done")
- "Great!" / "Perfect!" / "Done!" (before verification output)
- Any expression of satisfaction without evidence

### Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Verification Evidence Requirements

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Requirements met | Line-by-line checklist | Tests passing |

## Responsibilities

1. verify that the approved behavior was actually implemented
2. summarize what changed
3. identify remaining risks or follow-up work
4. prepare the change for archive or handoff
5. check for delta specs that need syncing

## Required Inputs

Read:

- `execution-contract.md`
- `tasks.md`
- relevant `specs/`
- change summary notes, if any

## Verification Steps

### Step 1: Test Suite Verification

Run the test suite for the affected code. Record:

- Number of tests run
- Number of tests passed/failed
- Any warnings or noise in test output (test output must be pristine)

### Step 2: Contract Obligation Check

Compare each obligation in `execution-contract.md` against the implementation:

- [ ] Each test obligation has a passing test
- [ ] Each batch has its "Done when" criteria satisfied
- [ ] Each review gate was passed
- [ ] No scope was added without artifact updates

### Step 3: Unintended Scope Detection

Check the diff for changes beyond what the contract approves:

- [ ] No new files outside the planned scope
- [ ] No modified files that weren't part of the change
- [ ] No new configuration without corresponding spec updates

## Final Checks

- Are required tests passing? (cite the command and output)
- Are execution batches complete? (cite batch-by-batch status)
- Was any scope added without artifact updates? (cite specific files if yes)
- Are there unresolved blockers or known risks?
- Is the change ready to archive, or should it remain active?
- Do delta specs exist that need merging into main specs?

## Output

Produce a concise wrap-up with:

- delivered behavior (with verification evidence cited)
- notable implementation constraints
- residual risks
- recommended next action

Also make clear whether the change is:

- ready to archive
- ready for user review
- blocked on follow-up work

## Archive Rule

Do not archive blindly.

If implementation diverged from the contract, return to `bridging` before closure.

## Post-Verification Routing

After verification completes:

1. If delta specs were created (new specs in the change folder, or specs with ADDED/MODIFIED/REMOVED/RENAMED markers), route to `spec-syncer` before archiving
2. If no delta specs exist, the change is ready to archive

The closure is not complete until delta specs are merged. Specs that aren't synced become lies.

## Output Standard

Your response should include:

1. verification evidence (command run, output excerpt, exit code)
2. contract obligation status (which passed, which didn't)
3. delivered behavior summary
4. residual risks
5. delta spec status (exist or not)
6. recommended routing (to `spec-syncer` or archive)
