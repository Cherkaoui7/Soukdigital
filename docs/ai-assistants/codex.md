# Codex Assistant Instructions

As a Codex / GitHub Copilot coding assistant, you must adhere to the global coding guidelines and architectural restrictions of the Souk Digital Marketplace project.

Please read the master guide before proceeding:
👉 [AI Assistant Guide (assistant-guide.md)](file:///c:/Users/USER/Downloads/Souk%20Digital%20Marketplace/docs/ai-assistants/assistant-guide.md)

## Core Guidelines for Codex
* **File Operations**: Never perform global grep or search operations in `venv/`, `.venv/`, or `node_modules/`. Use specific paths (e.g. `src/`, `backend/`).
* **Code Changes**: Ensure strict type validation and SSR compatibility (no `window` or `document` access on server rendering).
