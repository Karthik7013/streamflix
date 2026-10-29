# Review Current Changes & Verify Bug Fixes

## Context
Working tree has 11 modified files + 8 new files under `src/lib/`. Changes refactor the AI chat stack: model fallback chain, error classification, friendly error surfacing, stop/cancel support, and removal of client-selected model. `forms.test.ts` was updated to assert no raw upstream leak and envelope parsing.

## Goals
1. Confirm the refactor compiles and tests pass.
2. Verify each claimed bug fix actually holds.

## Verification Plan
1. Run `npx tsc --noEmit` for typecheck.
2. Run `npx vitest run src/lib/ai-chat.test.ts src/lib/ai-errors.test.ts src/lib/ai-model-health.test.ts src/lib/ai-models.test.ts src/lib/forms.test.ts`.
3. Run full test suite if above pass.
4. Manual spot checks:
   - `getFriendlyError` never returns raw upstream text (tests assert).
   - Envelope `{error:{message}}` is unwrapped.
   - AI routes use `createChatStreamResponse` and no longer import `DEFAULT_CHAT_MODEL`/`nvidia` directly.
   - `stop` wired through `useChat`/`useAdminChat` and `PromptInputSubmit` `onStop`.
   - `chatApiSchema`/`movieChatApiSchema` no longer accept `model`.

## Risks
- `ai-chat.ts` references `DEFAULT_CHAT_MODEL` from `ai-models.ts` (moved from gateway) — confirm import resolves.
- `recordModelSuccess` defined but never called — health never transitions to healthy; chain filtering only skips unhealthy. Acceptable but note.
- `getHealthyModelChain` uses `readHealth` (private-ish exported? no, internal) fine.

## Open Questions
- Should `recordModelSuccess` be invoked on successful stream to reset health? Currently only failures recorded. Recommend adding success recording in `ai-chat.ts` after stream completes without error.
- Confirm no callers still pass `model` to chat APIs (admin widget, ask-about-movie). Search needed.

## Task List
1. Typecheck.
2. Run targeted tests.
3. Run full suite.
4. Grep for remaining `model` usage in chat clients.
5. Optionally add `recordModelSuccess` on successful completion.
