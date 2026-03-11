# /triage — Summarize issues and recommend next work item

Follow these steps in order:

## 1. Fetch open issues

Run:

```bash
gh issue list --state open --limit 50 --json number,title,labels,createdAt,updatedAt,body,comments
```

## 2. Read current priorities

Read `ROADMAP.md` and focus on the **1.0.0 MVP — Remaining** checklist to understand what work is already planned.

## 3. Categorize and summarize

Group each issue into one of these categories:

- **Bug** — something is broken
- **MVP** — maps to an item on the 1.0.0 MVP checklist
- **Enhancement** — nice to have, not on MVP checklist
- **Question/Support** — user needs help, not a code change

For each issue, write a one-line summary (not the full body).

## 4. Prioritize

Rank the issues by recommending what to work on next using this priority order:

1. **Bugs** — broken things first
2. **MVP items** — anything that unblocks the 1.0.0 release
3. **Quick wins** — enhancements that are low effort / high impact
4. **Everything else**

Within each tier, prefer issues with more community engagement (comments, reactions).

## 5. Present the triage report

Output a report in this format:

```
# Issue Triage

**Open issues:** <count>
**Last triaged:** <today's date>

## Recommended next

> #<number> — <title>
> <one-line summary and why it should be next>

## Full triage

### Bugs
- #<number> — <title> — <one-line summary>

### MVP blockers
- #<number> — <title> — <one-line summary> — maps to: <roadmap item>

### Enhancements
- #<number> — <title> — <one-line summary>

### Questions / Support
- #<number> — <title> — <one-line summary>
```

If there are no open issues, say so and suggest picking the next unchecked item from the 1.0.0 MVP Remaining list in ROADMAP.md instead.
