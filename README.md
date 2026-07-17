# HeadVault

A terminal (CLI) and Telegram-based autonomous coding agent, built with TypeScript and Bun, using the Vercel AI SDK's tool-loop agent framework with OpenRouter for model access. It's an OpenClaw clone that can read, plan, and modify a codebase, with every file/folder/shell mutation staged and gated behind explicit user approval.

---

## Features

- **Three modes, available from both the CLI and Telegram:**
  - **Agent Mode** — give it a goal, it explores the codebase and stages file/folder/shell changes to accomplish it.
  - **Plan Mode** — generates a structured, step-by-step plan (with complexity ratings) for a goal, lets you pick which steps to run, then executes each selected step with its own agent tool loop.
  - **Ask Mode** — read-only Q&A about the codebase, with an option to save the answer as a `.md` file.

- **Safe-by-default mutations**
  - Every `create_file`, `modify_file`, `delete_file`, `create_folder`, and shell command is *staged*, not applied immediately.
  - Approval flow lets you approve/reject all changes at once or review them one-by-one, with a unified diff view before anything touches disk.
  - Path-traversal protection and configurable exclude patterns (`node_modules`, `.git`, `dist`, `build`, `.next`, `*.log`, `.env*`).

- **Tool executor** exposes: `read_file`, `create_file`, `modify_file`, `delete_file`, `create_folder`, `list_files`, `search_files`, `analyze_codebase`, `execute_shell` (staged), and `list_skills` / `read_skill` for discovering `SKILL.md` files under Cursor/Claude skill directories.

- **Optional web tools** (`web_search`, `web_crawl`, `fetch_url`) powered by Firecrawl — automatically enabled when `FIRECRAWL_API_KEY` is set, used by Plan Mode's research step and available to Agent/Ask modes.

- **Telegram bot**
  - Commands: `/start`, `/ask`, `/agent`, `/plan`
  - Inline keyboards for toggling plan steps and for approving/rejecting/reviewing diffs of staged changes.
  - Owner-only access, gated via `TELEGRAM_OWNER_ID`.

- **Terminal UI polish** — ANSI banner on startup (`figlet`), and Markdown rendering in the terminal via `marked` + `marked-terminal`.

---

## Tech Stack

| Layer            | Choice                                              |
|-------------------|------------------------------------------------------|
| Runtime            | [Bun](https://bun.sh)                                |
| Language           | TypeScript                                           |
| AI orchestration   | [Vercel AI SDK](https://sdk.vercel.ai) (`ai`)        |
| Model provider     | OpenRouter (`@openrouter/ai-sdk-provider`)           |
| CLI prompts        | `@clack/prompts`                                     |
| Telegram bot       | `telegraf`                                           |
| Diffing            | `diff` (unified patch format)                        |
| Web search/crawl   | `@mendable/firecrawl-js` *(optional)*                |
| Terminal rendering | `marked`, `marked-terminal`, `figlet`, `chalk`       |
| CLI entry          | `commander`                                          |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed
- An [OpenRouter](https://openrouter.ai) API key

### Install
```bash
bun install
```

### Environment variables
Create a `.env` file in the project root:

```bash
# required
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_DEFAULT_MODEL=your_model_id     # e.g. anthropic/claude-sonnet-4.5

# required for Telegram mode
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_OWNER_ID=your_telegram_user_id

# optional — enables web_search / web_crawl / fetch_url
FIRECRAWL_API_KEY=your_firecrawl_key
```

### Run
```bash
bun run index.ts wakeup
```
You'll see the HeadVault banner, then a prompt to choose between **CLI** and **Telegram** mode. From the CLI you can then pick **Agent**, **Plan**, or **Ask** mode.

If installed as a global bin (`headvault`), you can instead run:
```bash
headvault wakeup
```

---

## Project Structure

```
ai/                    # OpenRouter model provider setup
modes/
  agent/                # core agent: tools, tool executor, approval flow, diff view
  ask/                   # read-only Q&A orchestrator
  plan/                  # planner (structured JSON plan), step selection, web tools
  telegram/              # Telegram bot: handlers, sessions, approval UI
  cli.ts                 # CLI sub-mode picker
tui/
  terminal-md.ts         # Markdown -> terminal renderer
  wakeup.ts               # banner + CLI/Telegram entry point
index.ts                 # CLI entry (commander)
```

---

## Safety Notes
- All file and shell mutations are staged in memory (via an overlay/delete-set on the tool executor) and only written to disk after explicit approval.
- File paths are resolved and checked against the workspace root to prevent path traversal.
- Sensitive/noisy paths (`.env*`, `*.log`, `node_modules`, `.git`, `dist`, `build`, `.next`) are excluded from reads, writes, and search by default.

---

## Status
Core functionality complete: Agent, Plan, and Ask modes work end-to-end across both CLI and Telegram, with staged mutations, diff-based approval, and optional web research tooling.
