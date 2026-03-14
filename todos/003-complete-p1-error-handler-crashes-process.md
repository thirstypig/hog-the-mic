---
status: complete
priority: p1
issue_id: "003"
tags: [code-review, security, server]
dependencies: []
---

# Error Handler Re-throws and Crashes the Process

## Problem Statement

The Express error handler sends a JSON response and then immediately `throw err`, which will bubble up as an unhandled exception and crash the Node.js process.

## Findings

- **File:** `ktv-singer-server/server/index.ts:64-70`
- **Evidence:**
  ```typescript
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;  // ← crashes Node
  });
  ```

## Proposed Solutions

### Option A: Replace throw with console.error
- **Pros:** Simple, server stays up, errors still logged
- **Cons:** None
- **Effort:** Tiny
- **Risk:** None

## Recommended Action

Option A — replace `throw err` with `console.error("Unhandled error:", err)`.

## Technical Details

- **Affected files:** `ktv-singer-server/server/index.ts`

## Acceptance Criteria

- [ ] Error handler logs the error but does not crash the process
- [ ] Server remains running after handling 500-level errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | throw in error handler = process crash |

## Resources

- `ktv-singer-server/server/index.ts:64-70`
