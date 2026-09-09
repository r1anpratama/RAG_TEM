---
title: Principles and Rules
created: 2026-09-09
type: governance
tags:
  - rules
  - clean-code
  - ponytail
---

# Development Principles & Operating Rules

This document defines the strict governance rules and clean code standards for **RAG_TEM**.

---

## 1. Fundamental Project Rules
1. **Document Every Process in Obsidian**: Every step, command outcome, and design change must be logged neatly here in Obsidian. No disorganized work.
2. **Obsidian as Second Brain**: Always review these notes before undertaking any action or coding task.
3. **Strict Hierarchy**: Zero clutter in directories. All code goes to `src/`, all tests to `tests/`, and all datasets to `data/`.
4. **Ponytail Clean Code**: The best code is the code that never had to be written. Eliminate over-engineering and premature abstraction.
5. **100% English**: All code, docs, notes, commit messages, and PRs must be in English.
6. **Git Discipline**: Atomic, clear commits following Conventional Commits format. Sync with [r1anpratama/RAG_TEM](https://github.com/r1anpratama/RAG_TEM.git).

---

## 2. Ponytail Clean Code Ladder
Before writing any line of code, stop at the first rung that holds:

```text
1. Does this need to exist?   → No: Skip it (YAGNI)
2. Already in this codebase?  → Reuse it, do not rewrite
3. Stdlib does it?            → Use Python standard library
4. Native platform feature?   → Use native OS / shell / engine feature
5. Installed dependency?      → Use what is already installed
6. Can it be one line?        → Make it one line
7. Only then:                 → The minimum necessary code that works cleanly
```

### What is Never Cut:
- Deep understanding of the problem and flow before modifying code.
- Input validation at trust boundaries (APIs, file inputs, user prompts).
- Error handling that prevents data loss or silent failure.
- Security, privacy, and accessibility.
- Lean, runnable verification checks for all non-trivial logic.
