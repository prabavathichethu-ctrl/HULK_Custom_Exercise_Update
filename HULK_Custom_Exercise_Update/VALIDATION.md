# Custom exercise acceptance

Use synthetic records for saves, publishing and assignments. Inspect real members read-only. Preserve current memberships, nutrition targets, assignments and billing.

## Automated checks

Run the existing Admin + Studio and workout-button tests, plus tests/custom-exercises.test.mjs, against the installed public folder. The current local result was 49/49 passing, zero skipped. The existing DOM runner uses `linkedom`; set HULK_DOM_MODULE to its installed package path and HULK_SITE_ROOT to the project public directory. The new tests include stored-program server recomputation, malformed metadata rejection, manual save/reopen, language/day switching, equipment/readiness/time restrictions, snapshot immutability, escaped names/notes, muscle maps and member trackers/timers.

Run `node --check` on modified JavaScript modules and the installer. Verify the public/shared copies of custom-exercises.mjs and studio-program-engine.mjs are identical.

The included tests/custom-exercises-database.sql already passed twelve actual transaction-only database checks. It saves custom program JSON, verifies snapshot persistence and revision conflicts, and verifies trainer/member write restrictions. All its writes are rolled back. Backend support is already installed; do not run any setup/migration SQL.

## Authenticated browser checks before requesting Hosting deployment

- Owner → existing series → Add workout & diet program → Monday → Create my own exercise. Free-text name and equipment fields are visible immediately.
- Enter an exercise name absent from the fixed catalogue; add Kannada copy, equipment, primary/secondary/stabilising muscles and coaching notes. Verify muscle pictures reflect only selected regions.
- Set sets/reps/rest; switch days/language and return. No entered data is lost.
- Save a draft, refresh the page, reopen the program, and confirm the custom fields and exercise prescription persisted in the correct series.
- A draft may retain an unfinished custom exercise. Publishing it must show a specific error until name, equipment and a primary muscle are entered.
- Convert an existing catalogue row using Create my own exercise in its selector. Preserve sets/reps/rest. Switch it back to a preset and verify manual data is removed from that row.
- Save/publish a complete synthetic program. Preview it for a synthetic eligible member with compatible equipment and current approved nutrition. Confirm then approve once.
- Open the member's /plan in a fresh member session: exercise name, notes, selected muscle pictures, sets/reps/rest, set tracker and timer all work in English and Kannada.
- Edit the template's exercise name/muscles afterward. The previously approved member plan keeps the approved snapshot.
- Incompatible equipment, insufficient time, referred/medical readiness and stale revision guards still block assignment. Publishing a library program alone does not assign it to anyone.
- Trainer/member/anonymous sessions cannot create or edit private programs. Confirm membership access gates remain intact.
- Verify existing automatic programs, preset exercises, meals, the 21-food catalogue, admin saved-plan viewer, payments and legacy workouts remain available.
- Check 360/390/768/1440 px. Buttons, muscle selectors, manual fields and pictures wrap without horizontal clipping.

Report actual passed/failed/skipped checks and retain evidence. Remove only exact synthetic fixture IDs created for testing. Update HANDOFF.md. Ask for confirmation before Hosting deployment, then repeat the core workflow against the live site after deployment.

No authenticated browser/visual QA was run in the package creation environment because the supported browser-control plugin was unavailable. DOM tests and backend source verification do not replace these browser checks.
