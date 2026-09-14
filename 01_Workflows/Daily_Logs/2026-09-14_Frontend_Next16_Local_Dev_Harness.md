---
title: Frontend Repaired on Next.js 16 with a Local Dev Harness
created: 2026-09-14
type: daily-log
tags:
  - frontend
  - nextjs
  - tooling
  - google-drive
---

# Daily Log: 2026-09-14 - Frontend Repaired on Next.js 16 with a Local Dev Harness

> [!warning] Superseded
> The `C:\rag-tem-fe` harness described here has been **deleted**. The repository now lives
> at `D:\AGENT\RAG_TEM` on local disk, where `npm install` and `npm run dev` work directly
> with no mirror and no `--webpack` flag. See [[2026-09-14_Local_First_Migration]].
> This log is retained for the root-cause record.

## 1. Objective
Make `website/frontend` serve again and move it onto the newest Next.js release.

## 2. Root Causes Found
1. **The repository lives on a Google Drive volume.** `G:` reports as
   `rian.pratama@bmkg.go.id - Goo...`. Google Drive's virtual filesystem cannot host
   `node_modules`: `npm install` dies with `EBADF: bad file descriptor, write` plus
   `TAR_ENTRY_ERROR UNKNOWN`, and deletes/renames fail with `ENOTEMPTY`,
   `SetFileSecurityW EIO`, and `ENOENT`. `next dev` fails the same way while
   writing its `.next` cache. This is the structural cause of every frontend failure.
2. **The installed `node_modules` was a broken partial tree.** Only 38 top-level
   entries, `next` itself absent, and `@types/react` / `@types/node` missing.
3. **Directory junctions cannot be created on `G:`.** `mklink /J` answers
   "Local NTFS volumes are required to complete the operation", so `node_modules`
   cannot be linked back to local disk. (A junction created *on* `C:` pointing *at*
   `G:` does work, but Next.js app-router discovery will not follow it - proven
   experimentally: every route returned 404.)
4. **The shell that runs commands injects a pnpm user agent.** `npm_config_user_agent`
   is `pnpm/11.7.0 ...`, inherited from the agent host. Next.js reads that variable to
   choose a package manager, so it tried `pnpm add` against the unusable
   `G:\.pnpm-store` instead of using npm. Unsetting it to an `npm/...` value fixes it.

Cause 1 is structural; 2-4 are its symptoms.

## 3. What Was Built
A **local dev harness** at `C:\rag-tem-fe\frontend`, entirely outside Google Drive:

| Path | Role |
|---|---|
| `C:\rag-tem-fe\frontend\node_modules\` | dependencies installed on local NTFS |
| `C:\rag-tem-fe\frontend\src\` | mirrored copy of the repository `src/` |
| `C:\rag-tem-fe\frontend\public\` | mirrored copy of the repository `public/` |
| `C:\rag-tem-fe\frontend\*.{json,mjs,ts}` | config copies (package, tsconfig, next, postcss, tailwind, env) |
| `C:\rag-tem-fe\sync.ps1` | documents the mirror loop (robocopy `/MIR` every 2 s) |

- `next.config.mjs` in the harness adds one workaround, `config.resolve.symlinks = false`,
  kept only while `src/` was junctioned. It is harmless and retained so the harness also
  works if the junction approach is retried.
- The mirror runs as a 2 s `robocopy /MIR` poll, not a `FileSystemWatcher`, because
  Google Drive raises no reliable change notifications.

## 4. Repository Changes
1. `website/frontend/package.json` - `next` raised `^15.5.25` -> `^16.3.5`; the
   `lint` script (`next lint`) removed because Next.js 16 deleted that command and the
   project has no ESLint dependency.
2. `website/frontend/package-lock.json` - regenerated against Next.js 16.3.5.
3. `website/frontend/tsconfig.json` - the two changes Next.js 16 makes mandatory:
   `jsx` `preserve` -> `react-jsx`, and `.next/dev/types/**/*.ts` added to `include`.
4. `website/frontend/node_modules/` and `.next/` were removed from Google Drive;
   `node_modules_broken` (the corrupted pnpm tree) was removed too.

## 5. Verification
| Check | Result |
|---|---|
| `http://localhost:3000/` | 200, 110,723 bytes, title `Prototype \| RAG Model Dashboard` |
| `http://localhost:3000/dashboard` | 200, 112,857 bytes |
| Page markers | "Earthquake Early Warning" and "RAG Architecture" both present |
| Next.js version | 16.3.5 (webpack mode) |
| Backend `:8000/api/health` | 200 |
| Backend `:8000/api/triage/scenarios` | 200, 5 scenarios |
| Backend `:8000/api/triage/faults` | 200, 31 KB, key `faults` |
| Classic API `:8080/docs` | 200 |
| Mirror daemon | create and delete both propagate repo -> harness |
| Core test suite | 28/28 passing |

## 6. How To Restart
```powershell
# 1. mirror repo source into the harness
$repo='G:\Other computers\My PC\NCU (Master Degree)\Lab\nvidia\prototype\RAG_TEM\website\frontend'
$dest='C:\rag-tem-fe\frontend'
$rc=@('/MIR','/NJH','/NJS','/NP','/NDL','/NFL','/NC','/NS','/R:1','/W:1')
while($true){ foreach($d in @('src','public')){ robocopy "$repo\$d" "$dest\$d" @rc | Out-Null }; Start-Sleep 2 }

# 2. serve (webpack mode: Turbopack refuses to compile outside the project root)
cd C:\rag-tem-fe\frontend
$env:npm_config_user_agent='npm/11.18.0 node/v26.0.0 win32 x64'
npm run dev -- --webpack
```

## 7. Limitations
- The harness is a workaround, not a fix. The durable fix is to move the repository off
  Google Drive onto local NTFS, after which `npm install` and `npm run dev` work directly
  in `website/frontend` and this harness can be deleted.
- Config files are copies, not mirrors. Editing `package.json`, `tsconfig.json`,
  `next.config.mjs`, `postcss.config.mjs`, or `tailwind.config.ts` in the repository
  requires re-copying them into `C:\rag-tem-fe\frontend`.
- `src/` and `public/` only flow repository -> harness. Editing in the harness is
  overwritten within 2 s.
