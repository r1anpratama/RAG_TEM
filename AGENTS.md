# RAG_TEM Agent Guidelines & Operating Rules

## 1. Operating Rules & Core Principles
1. **Obsidian Documentation**: All processes, architectural decisions, and experiments must be logged neatly in Obsidian. No unstructured or messy files.
2. **Second Brain Alignment**: Treat Obsidian as the primary second brain. Read existing notes and designs before beginning any task.
3. **Strict Hierarchy**: Adhere to structured folders (`00_Index/`, `01_Workflows/`, `02_Architecture/`, `src/`, `data/`, `tests/`).
4. **Ponytail Clean Code**: Write minimal, clean, safe, and efficient code following the Ponytail ladder.
5. **English Standard**: 100% English for code, files, documentation, notes, and commit messages. Bahasa Indonesia is only for chat conversation.
6. **Git Discipline**: Keep repository `https://github.com/r1anpratama/RAG_TEM.git` clean, follow Conventional Commits, ignore temporary and cache files.

## 2. Ponytail Ladder (Lazy Senior Dev Mode)
Before writing any code, stop at the first rung that holds:
1. Does this need to be built at all? (YAGNI)
2. Does it already exist in this codebase? Reuse it.
3. Does the standard library already do this? Use it.
4. Does a native platform feature cover it? Use it.
5. Does an already-installed dependency solve it? Use it.
6. Can this be one line? Make it one line.
7. Only then: write the minimum necessary code that works safely.

Never cut:
- Problem understanding (trace the flow end-to-end first).
- Input validation at trust boundaries.
- Error handling that prevents data loss.
- Security and accessibility.
- Lean verification check for non-trivial logic.
