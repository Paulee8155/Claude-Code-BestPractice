# decisions.md — Architecture Decision Log

Record significant technical decisions here so future Claude sessions and team members understand why things are the way they are.

---

## Active Decisions

_No decisions recorded yet._

---

## Decision Template (ADR)

```markdown
## ADR-[number]: [Title]

- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | deprecated | superseded by ADR-[n]

### Context
[What situation forced this decision? What constraints exist?]

### Decision
[What was decided?]

### Rationale
[Why this option over the alternatives?]

### Alternatives considered
- **[Option A]:** [why not chosen]
- **[Option B]:** [why not chosen]

### Consequences
- **Positive:** [what this enables]
- **Negative:** [what this constrains or costs]

### Review trigger
[When should this decision be revisited? e.g. "If we exceed 10k users"]
```

---

## Example

```markdown
## ADR-001: Use PostgreSQL over MongoDB

- **Date:** 2024-01-15
- **Status:** accepted

### Context
Choosing a database for the main application. Data is relational
(users → organizations → projects → tasks with foreign key constraints).

### Decision
Use PostgreSQL.

### Rationale
Data is inherently relational. PostgreSQL gives us joins, transactions,
and schema enforcement without extra application-level complexity.

### Alternatives considered
- **MongoDB:** Schema flexibility not needed. Would require manual
  integrity enforcement in the application layer.

### Consequences
- Positive: Data integrity enforced by DB, simpler application code
- Negative: Schema migrations required for structural changes

### Review trigger
If requirements change to need flexible, unstructured document storage.
```
