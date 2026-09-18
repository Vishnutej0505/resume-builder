# Data Model

Full field-level schema, validation rules, and the ERD are in `ARCHITECTURE.md` (project root) — this note is the shape to remember day-to-day.

```
Resume (single master record per user, no id — it's a true singleton)
- schemaVersion: int          // starts at 1, see [[Things To Avoid]]
- personalInfo: { name, email, phone, location, linkedIn }
- sections: [
    { type: enum(summary|education|experience|projects|skills|certifications),
      order: int,
      items: [ { title, subtitle, dateRange: string (free text), bullets: [string] } ] }
  ]
- selectedTemplate: string
- updatedAt: datetime

AIUsage (local, singleton)
- schemaVersion: int
- freeCreditsRemaining: int   // starts at ~20, one-time, not monthly
- subscriptionActive: bool    // from Play Billing subscription state
- subscriptionProductId: string | null
- lastSyncedAt: datetime
```

No `freeCreditsExhausted` field — it's derived (`freeCreditsRemaining <= 0`), computed at read time rather than stored, to avoid a second source of truth drifting out of sync. See → [[Things To Avoid]].

**Deliberately no persisted per-job-description tailored versions.** Only one master resume exists. When a subscriber re-tailors for a new job, the AI-adjusted output is session-only (see → [[Monetization Model]], "Option A"), never written back into this data or saved as a separate record. This keeps the data model this simple on purpose.

← back to [[Resume Builder MOC]]
