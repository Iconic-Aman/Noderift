cd 

# Building an AI Agent Harness from Scratch

This guide explains how we built a custom agent harness in this repository to run, correct, and verify a coding agent using a small local/free model (**Llama 3.1 8B via Groq**).

---

## 1. What is an Agent Harness?

As coined by Mitchell Hashimoto, **Harness Engineering** is the practice of designing the environment around an AI agent to prevent failures. While *guardrails* catch structural failures (like timeouts or API failures), a *harness verification step* catches semantic failures (like the model outputting incorrect values or guessing API keys).

---

## 2. Core Architecture

The harness is split into 5 modular, single-responsibility files (all under 200 lines to ensure maintainability):

```
coding-agent/
├── 1-tools.ts       ← Tool registry (runs code, fetches API metadata)
├── 2-model.ts       ← LLM config & custom XML arguments parser
├── 3-context.ts     ← State & prompt setup
├── 4-guardrails.ts  ← Ground-truth validation
├── 5-loop.ts        ← Orchestrated execution & self-correction loop
└── index.ts         ← Dual-mode entrypoint (with / without harness)
```

---

## 3. Step-by-Step Implementation

### Step 1: Tool Registry (`1-tools.ts`)

We expose two tools to the agent:

1. **`run_python_code`**: Executes Python code directly in-memory via `stdin` to avoid writing code blocks to disk. If the script throws a `KeyError` or `TypeError`, the harness appends a hint encouraging the agent to inspect the API structure.
2. **`fetch_api_data`**: Fetches raw JSON data from the weather URL environment variable so the agent does not have to guess keys.

### Step 2: Model Config & Parser (`2-model.ts`)

Initializes the OpenAI/Groq client and includes **`parseModelArgs`**:

* Groq's 8B model often outputs raw XML tags (`<function=run_python_code>{"code":"..."}</function>`) instead of standard JSON tool calls.
* The parser extracts code directly from these tags, unescapes characters (like converting escaped single quotes `\'` to `'`), and anchors keywords using word boundaries (`\bcode\b`) so it doesn't match variables like `status_code` as the code property.

### Step 3: Context Initializer (`3-context.ts`)

Constructs the initial system instructions and prompts. It defines the goal: *download weather data from `WEATHER_API_URL`, convert temperature to Fahrenheit and wind speed to mph, and save it to `weather_summary.json`*.

### Step 4: Ground-Truth Verification (`4-guardrails.ts`)

Contains **`verifyOutput`**:

* Reads the generated `weather_summary.json`.
* Independently fetches `WEATHER_API_URL` to get the true weather values.
* Computes expected Fahrenheit and wind speed values.
* Compares them using a $\pm 0.5$ tolerance to handle rounding. If it fails, it returns a detailed message explaining the difference.

### Step 5: Agent loop (`5-loop.ts`)

Orchestrates the multi-turn agent loop:

1. Calls the LLM (set at a focused `temperature: 0.1`).
2. Catches tool calls (both standard JSON and XML-intercepted tag format).
3. Executes the code and runs verification.
4. Feeds back traceback errors (if it crashed) or math discrepancy reasons (if it wrote incorrect values).
5. Provides a togglable `runWithoutHarness` mode to demonstrate the difference.

---

## 4. Verification: How to Run the Demo

### Prerequisites

Configure your `.env` file inside `coding-agent/`:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
WEATHER_API_URL=https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m
```

### Run Mode A (WITH Harness)

Open [coding-agent/index.ts](file:///d:/working-place/agent-harness/ai-harness/coding-agent/index.ts) and ensure only Mode A is active:

```typescript
await runLoop(messages, __dirname); // Mode A: Run WITH harness
// await runWithoutHarness(messages, __dirname); // Mode B: Run WITHOUT harness
```

Run the command:

```sh
npx tsx coding-agent/index.ts
```

**What to expect**:

1. **Iteration 1**: The model writes Python code but crashes with `KeyError: 'main'`. The harness catches the crash and prints a hint to use `fetch_api_data`.
2. **Iteration 2**: The model reads the hint, calls `fetch_api_data`, and sees the real keys (`temperature_2m`).
3. **Iteration 3**: The model writes the correct code. The harness verifies it against the live weather data and prints `Success`.

### Run Mode B (WITHOUT Harness)

Toggle the active line in `index.ts` to Mode B:

```typescript
// await runLoop(messages, __dirname);
await runWithoutHarness(messages, __dirname);
```

Run the command:

```sh
npx tsx coding-agent/index.ts
```

**What to expect**:
The model prints its response and executes it once. It guesses JSON keys like `temp_c` or `main.temp`, throws a `KeyError` traceback, and immediately exits as a dead-end with no recovery.
