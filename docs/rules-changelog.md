# Business Rules Changelog

## 2026-03-28 — Validation Rules (#13)

| Rule | Entity | Type | Trigger | Description |
|------|--------|------|---------|-------------|
| validate_appointment_date_future | appointments | validate | before_save | Rejects appointments with date in the past |
| validate_patient_contact | patients | validate | before_save | Requires at least phone or email |
| validate_exception_date_range | exceptions | validate | before_save | Ensures to_date >= since_date |

Rules created via Fyso MCP. Publish blocked by server-side bug (`{} is not iterable`) -- reported as feedback. Rules are in draft status and will be published once the bug is resolved.
