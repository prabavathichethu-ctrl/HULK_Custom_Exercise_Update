# HULK · Owner-entered exercises

This focused update adds **Create my own exercise** to the existing Series & Programs workout builder. Read the active project's latest HANDOFF.md first and preserve newer work. Install on top of the combined Admin + Studio update and the workout button fix.

## Owner workflow

1. Studio → Series & Programs → open a series or click its **Add workout & diet program** button.
2. In the coach-built workout choose a day and click **Create my own exercise**.
3. Enter your exercise name (any language), optional Kannada name, required equipment, primary muscles, optional secondary/stabilising muscles, and optional coaching instructions.
4. Set sets, reps, rest and repetitions in reserve. The muscle picture uses the coach-selected regions, rather than guessing from the exercise name.
5. Save the program draft. Reopen it to edit your manual exercise. Complete the required name/equipment/primary-muscle fields before publishing.
6. Existing exercises remain under **Choose from existing list**. An existing row's Exercise dropdown also offers **Create my own exercise**, while preserving its sets/reps/rest.
7. Publish and use the existing individual preview/confirmation/approval flow. Approved member plans retain their own copy of the custom name, notes, equipment and muscle metadata; later template edits do not rewrite those plans. Set tracking and rest timers remain available.

Custom exercise definitions are stored inside each program and approved plan. This release adds manual exercises within a program; it does not create a separate global exercise-library management section. The automatic quiz generator continues using the existing audited catalogue.

## Backend · already installed

Read BACKEND_STATUS.json. The additive `fitness-library` support is ACTIVE v3 in project `iufsxnlonwnylqerwafs`, with JWT verification enabled. Its eight deployed source files were read back and matched this package. Only the shared Studio builder and the new custom-exercise module changed. Other functions, including fitness-plan v2 and fitness-intake v2, were retained.

No SQL/schema changes are required. The existing owner-only program JSON storage and server-mediated assignment approval are used. Twelve actual database acceptance checks passed inside BEGIN/ROLLBACK; their synthetic users/staff/members were confirmed absent afterward.

Do not rerun old quiz/nutrition/library setup SQL, redeploy existing functions, or invent plans for real members. Included backend dependencies are the exact verified source snapshot for version control/recovery. If the live backend has changed since BACKEND_STATUS.json, compare it before any backend operation.

## Install into the existing project

1. Confirm the active project from HANDOFF.md and back it up.
2. From this extracted update folder run:

   ```powershell
   node tools/apply-update.mjs "C:\Users\cheth\Downloads\hulk-fitness-site (4)\hulk-fitness-site"
   ```

   Replace the example path if the active project moved. This verifies all hashes/dependencies before writing, backs up affected source, and installs eight frontend modules plus two backend source files. It never writes to the database or deploys. Newer/different local work stops installation before any write; apply changes.diff with a focused merge in that case.
3. Run VALIDATION.md, show the actual local preview and test results, and update HANDOFF.md.
4. Obtain the user's confirmation before deploying Firebase Hosting only to `hulk-fitness-1bab2`.
5. After Hosting deployment, verify live frontend hashes and the full synthetic-account workflow, including a fresh member session. Refresh existing Studio/member tabs to load the updated entry modules.

The frontend has not been deployed by this package's creator. Browser acceptance checks remain to be completed in Antigravity.
