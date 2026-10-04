# Skill Reference: ponytail-review

- **Domain**: Architecture, Anti-bloat, Minimal Engineering
- **Origin**: `C:\Users\AsusFahadLaptop\.gemini\config\plugins\ponytail\skills\ponytail-review\SKILL.md`

## Core Capabilities
- Auditing codebases to strip premature abstraction, unnecessary boilerplate, and speculative features.
- Keeping utility functions laser-focused on minimal required functionality.

## Project Application
- Applied strictly to `frontend/src/lib/graphViewerUtils.ts` to ensure it only performs visual resolution and counting, without leaking into graph traversal algorithms.
