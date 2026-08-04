# Hackathon handoff — 2026-08-04

## Resume point

- Primary checkout: `/home/behdad/wedding`, branch `main`.
- Main/live commit at handoff: `a45a2273` (`Keep room progress silent during Phase 1`).
- Deploy command: `git puff origin main && ssh behdad "cd w && git pull"`.
- Port 8000 serves the primary checkout.
- Do not merge an old worktree wholesale. Main contains newer integrated work; inspect and
  cherry-pick only a returned issue's isolated commit.
- `docs/automatic-transmission-proposal.md` is intentionally untracked at the owner's request.
  It is the only expected `git status --short` entry.

## Just shipped

- `35cf22eb`: a fresh pedal or steering input resumes a transport-paused Road Trip.
- `791e4d9b`: lower-room tests follow the shared vertical-chevron/no-label contract.
- `b4027982`: vertical floor navigation shortened to 400 ms with a nominal 200 ms handoff.
- `37f7854e`: police warning/pursuit/capture/approach/arrest clocks keep running after a
  head-on impact stalls the Porsche. This also lets the already-implemented rear radar
  finish its 0.8-second/40-metre measurement after a crash.
- `a45a2273`: Phase 1 tracks rooms silently; `Rooms seen N/10` is Phase 2 only.

The owner confirmed suspension reset (`dd4b02fe`). Core `check`, `state`, and `play` suites
passed after the pause-resume work. The police suite's radar/crash assertions passed during
the latest run; rerun `node tests/entrance-police.js` because a temporary asynchronous probe
made a later centre-line timing assertion race, and the probe was simplified before commit.

## Fixed, awaiting owner confirmation

- Pedal/steering resumes a Road Trip paused by Space, Enter, or Play.
- Police encounter and rear-radar progression no longer freeze after an incoming-car crash.
- Phase-1 room-progress captions are suppressed.
- Faster 400 ms vertical floor transition.

## Broken navigation follow-up — take first

The owner tested the current live navigation and rejected it:

1. Up/down chevrons are optically off-centre in opposite directions.
2. The visible chevron handoff does not look like it occurs at the true transition midpoint,
   despite the synthetic timing test.
3. The first-downstairs navigation coach is absent. It must appear with Up at the midpoint
   and remain through room settle/caption churn until explicit dismissal or Up use.
4. A stale `Dungeon...` caption can restore after returning to Cuddly.

The prior `navigation_copy` agent ended before these real-path fixes were committed. Resume in
the isolated worktree `/tmp/wedding-navigation-copy-20260803` or create a fresh worktree from
`main`; do not edit shared main in parallel with another agent.

## Todo, smallest/game-blocking first

1. Fix and ship the four navigation regressions above as separate commits where distinct.
2. Allow automatic R↔D selection while rolling in the opposite direction below 10 km/h.
3. Add alternating red/blue pursuit flashes to the police car in the rear-view mirror.
4. Remove the Road Trip → HUD resize/zoom handoff that causes tearing; swap atomically.
5. Show persistent PRND/Dn state on the instrument panel or shifter.
6. Replace misleading `CLEAN` at nonzero demerits; add BAC state and decay one drink-equivalent
   per minute.
7. Add high-speed 360 behavior, recover a backwards car that leaves the frame, and suppress
   annoying highway ABS chatter.
8. Fade party music while departing guests walk out.
9. Add the owner's no-new-ARIA-labels rule to `docs/developer.md` during the final manual/docs
   pass. Do not add ARIA labels to new controls in the meantime.

Known broader Road Trip harness reds seen before this handoff: first-lap offer, low-speed manual
neutral, and manual shift-coach assertions. Keep them separate from unrelated feature commits.

## Workflow invariants

- One issue at a time; one discrete commit per confirmed issue.
- Never leave completed code uncommitted. Commit, `git puff`, and deploy immediately.
- Keep todo and fixed-awaiting-confirmation lists explicit.
- Every delegated agent uses its own worktree/branch; review and cherry-pick returned commits.
- Use the required co-author trailer on every commit.
- Do not update the game/developer manuals broadly until the final documentation round, except
  for the explicit no-ARIA rule above.
