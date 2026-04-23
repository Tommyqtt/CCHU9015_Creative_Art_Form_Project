# QA Report

## Route Matrix

| Path | Expected Ending | Actual Ending | Status | Issues |
|------|-----------------|---------------|--------|--------|
| S1→scroll past | E1 Skeptic | E1 Skeptic | PASS | None |
| S1→click→B2 close | E1 Skeptic | E1 Skeptic | PASS | None |
| S1→sub→C2→E1 | E2 Rational | E2 Rational Consumer | PASS | None |
| S1→sub→C3→F1 | E3 Silent | E3 Silent Observer | PASS | None |
| S1→sub→C1→D1→G1 | E4 Realist | E4 Informed Realist | PASS | None |
| S1→sub→C1→D3 | E5 Betrayed | E5 Betrayed | PASS | None |
| S1→sub→C1→D1→G2 | E5 Betrayed | E5 Betrayed | PASS | None |
| S1→sub→C1→D1→G3 | E6 Verification | E6 Verification Seeker | PASS | None |
| S1→sub→C1→D2→H1 | E7 Happy Ignorant | E7 Happy Ignorant | PASS | None |
| S1→sub→C1→D2→H2→G1 | E4 Realist | E4 Informed Realist | PASS | None |

## Loopbacks

| Loopback | Expected Destination | Actual Destination | Status | Issues |
|----------|----------------------|--------------------|--------|--------|
| S5 option 2 | S4 | S4 | PASS | None |
| S6 option 2 | S4 | S4 | PASS | None |
| S8 option 2 | S7 | S7 | PASS | None |
| Ending → Replay | Fresh title screen | Fresh title screen | PASS | None |

## Additional Checks

- Console: no uncaught app errors during the sweep. Only browser-automation warnings about non-blocking native dialogs appeared.
- Assets: no broken-image requests observed. All exercised assets returned `200`.
- Replay / stale timers: repeated `R` restarts and `Replay` button returns stayed stable; no duplicate UI responses or stuck transitions observed.
- Performance: CPU profile across restart/start/scene transitions stayed effectively idle (`0.3%` active samples, `99.7%` idle). No sign of runaway timers or listener leaks in the tested flows.

## Result

All intended endings and loopbacks verified green after the current fixes.
