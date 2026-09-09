# Core Operating Rules: RAG_TEM

These 6 rules are mandatory and govern all actions, file creations, coding, and git interactions in this project:

## Rule 1: Systematic Obsidian Documentation
- Every technical decision, pipeline modification, architecture choice, and process execution must be documented cleanly and systematically in Obsidian.
- Keep documentation organized under dedicated directories (`00_Index`, `01_Workflows`, `02_Architecture`, `03_Literature_and_Domain`, `04_Decisions_ADR`). Never leave orphan notes or clutter.

## Rule 2: Obsidian as the Second Brain
- Treat the Obsidian vault as the primary intelligence base.
- Before executing tasks, implementing features, or making changes, always inspect and align with existing notes, specs, and architectural decisions stored in the vault.
- Update the relevant notes immediately after executing changes so the second brain stays synchronized with reality.

## Rule 3: Strict Clean Folder Hierarchy
- Maintain clean, modular, and non-cluttered folder structures.
- Source code lives in `src/` (layered into `domain`, `pipelines`, `utils`).
- Obsidian notes reside in numbered top-level directories (`00_`, `01_`, etc.).
- Datasets live in `data/raw/` and `data/processed/`.
- Never dump random temporary files in the root folder.

## Rule 4: Ponytail Clean Code & Lazy Senior Dev Methodology
- Adhere strictly to the Ponytail ladder:
  1. Does this need to be built at all? (YAGNI)
  2. Does it already exist in this codebase? Reuse it.
  3. Does the standard library already do this? Use it.
  4. Does a native platform feature cover it? Use it.
  5. Does an already-installed dependency solve it? Use it.
  6. Can this be one line? Make it one line.
  7. Only then: write the minimum necessary code that works safely.
- No gratuitous abstractions, premature optimizations, or bloated boilerplate.
- Ensure trust-boundary validation, error handling, security, and hardware calibration remain robust.
- Provide lean verification checks for non-trivial logic.

## Rule 5: 100% English for All Technical Artifacts
- All file names, folder names, variable/function/class names, code comments, docstrings, technical documentation, Obsidian notes, git commit messages, and PR descriptions must be written in English.
- Bahasa Indonesia is reserved solely for conversational interactions with the user in chat.

## Rule 6: GitHub Cleanliness & Hygiene
- Keep `README.md`, repository descriptions, and release notes polished and professional.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Keep the repository clean by excluding temporary files, workspace cache, and unnecessary clutter via `.gitignore`.
- Target repository: `https://github.com/r1anpratama/RAG_TEM.git`.
