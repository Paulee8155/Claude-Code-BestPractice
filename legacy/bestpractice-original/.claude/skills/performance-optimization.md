---
name: performance-optimization
description: Use when there's a measured performance problem, NOT speculatively. Measure first, fix the actual bottleneck, then verify the fix. Triggers on "this is slow", "optimize X", "reduce latency", or performance regression reports.
---

# Performance Optimization

> Premature optimization is the root of all evil. — Knuth

Measure first. Fix the proven bottleneck. Verify the gain.

## Process

### Step 1 — Define "slow"

You don't have a perf problem until you can quantify it:
- Current: P50 = X ms, P95 = Y ms, P99 = Z ms
- Target: P95 < N ms (with a reason for N — user perception, SLA, etc.)

If you don't have numbers, you have a feeling, not a problem.

### Step 2 — Measure with real data

Profile against representative load:
- Real production-like data sizes
- Real query patterns (not just one warm-cache call)
- Real concurrency

Tools: language profilers, browser devtools, load test (k6/wrk/locust),
APM if you have one.

### Step 3 — Find the actual bottleneck

The bottleneck is rarely where intuition says it is.
- Read the profile flame graph
- Find the dominant span
- Check: is it CPU, I/O, DB, network, GC, or wait?

Optimize the dominant cost. Optimizing a 5% cost is a 5% gain at best —
usually less after you make the code worse.

### Step 4 — Apply the targeted fix

Common high-leverage fixes:
- N+1 query → batch / join / preload
- Missing index → add it
- Sync I/O on hot path → make async / move off-thread
- Redundant work in loop → cache / hoist
- Large payload over network → paginate / compress / project columns
- Cold cache on every call → warm at startup or on first miss

Apply ONE fix at a time. Multiple simultaneous changes hide which one helped.

### Step 5 — Re-measure

Same workload, same conditions:
- Did P95 actually drop?
- Did anything else regress?
- Is the gain worth the complexity?

If the gain is < 10% and you added complexity, revert. The complexity will
cost you more than the gain over time.

## Frontend specifics (Core Web Vitals)

| Metric | Target | Common cause |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Heavy images, render-blocking CSS, slow server |
| INP (Interaction to Next Paint) | < 200ms | Long JS tasks on main thread |
| CLS (Cumulative Layout Shift) | < 0.1 | Images without dimensions, late-injected ads |

## Anti-rationalization

| Excuse | Counter |
|---|---|
| "I know what's slow, let me just fix it" | Measure first. Intuition is wrong > 50% of the time on perf. |
| "Adding a cache will make it faster" | Until invalidation. Caches add bugs. Prove the cache is needed first. |
| "More indexes = faster" | Indexes slow writes + cost storage. Add only the index proven needed. |
| "I optimized 10 things, it should be much faster" | Then which one helped? Revert all, apply one, measure. |
| "Performance doesn't matter for v1" | Performance is a feature. Measure even in v1 so you know baseline. |

## Done when

- Bottleneck was measured, not guessed
- Fix is targeted at the dominant cost
- After-measurement shows ≥ target gain
- Complexity added is justified by gain
- Regression test added to CI to catch perf regressions
