fix: isolate attendance state per group and dedupe pending saves

- Reset group-specific roster, attendance, summaries, retardos, receipt, save status, and local UI state whenever the active plantel/grado/grupo changes.
- Replace rosters for the active group instead of merging them with previously loaded groups, preventing mixed student lists in saved attendance payloads.
- Guard async roster, attendance, retardos, weekly summary, and logros responses so stale requests cannot mutate a newly selected group.
- Scope attendance totals to the current roster students only.
- Collapse pending offline attendance entries by plantel, grado, grupo, and date so older queued saves cannot replay after a newer register and overwrite it.
