# flowdeploy-runner

> The Python orchestration engine for FlowDeploy — reads YAML pipelines, spins isolated Docker containers for each step, streams live logs to the API, and reports results back.

---

## What this service does

This is the heart of FlowDeploy. While Express manages the data and React shows the UI, the Python runner is the one actually doing the work. It does four things:

- **Polls** the Express API every 5 seconds looking for queued jobs
- **Parses** the YAML pipeline definition to extract steps, images, commands, and env vars
- **Executes** each step in a fresh, isolated Docker container using the Docker SDK
- **Streams** every log line back to Express in real time, which forwards it to the browser

---

## Tech stack

| Tool | Purpose |
|---|---|
| Python 3.11+ | Core language |
| Docker SDK for Python | Spin up and manage containers |
| PyYAML | Parse pipeline YAML definitions |
| Requests | HTTP calls to the Express API |
| python-dotenv | Environment variable management |

---

## Folder structure

```
flowdeploy-runner/
├── runner.py             ← main entry point, polling loop
├── yaml_parser.py        ← reads and validates pipeline YAML
├── docker_executor.py    ← runs each step in a Docker container
├── log_streamer.py       ← sends log lines and status to Express
├── requirements.txt      ← Python dependencies
└── .env                  ← API URL and poll interval
```

---

## Getting started

### Prerequisites
- Python 3.11+
- Docker installed and running (`sudo service docker start`)
- Express API running on port 5000

### Create a virtual environment
```bash
cd flowdeploy-runner
python3 -m venv venv
source venv/bin/activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Set up environment variables
Create a `.env` file inside `flowdeploy-runner/`:
```env
API_BASE_URL=http://127.0.0.1:5000
POLL_INTERVAL=5
```

### Make sure Docker is running
```bash
sudo service docker start
docker ps   # should show an empty table, no errors
```

### Start the runner
```bash
python runner.py
```

You should see:
```
[runner] FlowDeploy Python runner started
[runner] Polling http://127.0.0.1:5000 every 5s
[runner] No queued jobs — waiting...
```

---

## How it works — step by step

### Step 1 — Polling
Every 5 seconds `runner.py` calls `GET /api/jobs/queued` on Express. If there are no queued jobs it prints "No queued jobs — waiting..." and sleeps again.

### Step 2 — Fetching the pipeline
When a queued job is found, the runner fetches the pipeline definition from `GET /api/pipelines/internal/:id`. This gives it the raw YAML string the user wrote.

### Step 3 — Parsing the YAML
`yaml_parser.py` reads the YAML and validates it — checks that every step has a `name`, `image`, and `run` command. If the YAML is invalid the job is immediately marked as failed with a clear error message.

### Step 4 — Executing steps
For each step, `docker_executor.py`:
1. Pulls the Docker image if not already cached
2. Spins up a brand new isolated container
3. Runs the command inside it
4. Captures every line of stdout/stderr
5. Streams each line to Express via `log_streamer.py`
6. Waits for the container to finish
7. Checks the exit code — 0 = passed, anything else = failed
8. **Always** removes the container in a `finally` block

### Step 5 — Reporting results
After every step, the runner updates the job status in MongoDB via `PATCH /api/jobs/:id/status`. If any step fails, the pipeline stops immediately and the job is marked as failed. If all steps pass, the job is marked as passed.

---

## Pipeline YAML format

The runner expects pipelines in this format:

```yaml
name: my-node-app

trigger:
  on: push
  branch: main

env:
  NODE_ENV: production

steps:
  - name: Install dependencies
    image: node:18
    run: npm install

  - name: Run tests
    image: node:18
    run: npm test

  - name: Build
    image: node:18
    run: npm run build
```

### Rules
- Every step must have `name`, `image`, and `run`
- Steps run in order — top to bottom
- Each step gets a completely fresh Docker container
- If one step fails, all subsequent steps are skipped
- `env` values are injected into every container as environment variables

---

## Key design decisions

**Why Docker SDK instead of subprocess?** The Docker SDK gives full programmatic control — pulling images, setting memory limits, streaming logs, and removing containers — all in clean Python code without shell escaping risks.

**Why polling instead of a message queue?** Polling is simpler to set up and debug, and for a project of this scale it's perfectly adequate. A production system would use Redis/Celery for the job queue, which is a natural next step.

**Why `try/finally` for container removal?** Containers must be removed even if the step crashes, errors out, or times out. Wrapping in `try/finally` guarantees cleanup happens no matter what — preventing orphaned containers from piling up on the host.

**Why stream logs line by line instead of at the end?** The whole point of FlowDeploy is live log visibility. Waiting until a step finishes to show logs defeats the purpose. The Docker SDK's `stream=True` flag gives us each line the moment it's printed.

---

## How log streaming works

```
Docker container prints a line
          ↓
docker_executor.py captures it via container.logs(stream=True)
          ↓
log_streamer.py POSTs it to Express: POST /api/logs/:jobId
          ↓
Express saves it to MongoDB + pushes it to all open SSE connections
          ↓
Browser receives it instantly via EventSource
```

---

## Troubleshooting

**Docker socket error — FileNotFoundError**
```bash
sudo service docker start
sudo chmod 666 /var/run/docker.sock
```

**Runner finds jobs but they all fail with steps: []**
The runner cannot reach the Express API. Check:
- Express is running on port 5000
- `API_BASE_URL` in `.env` is correct
- The `/api/pipelines/internal/:id` route exists in Express

**Image pull takes too long**
The first run of any image (like `node:18`) will take time to download. Subsequent runs use the cached image and are much faster.

**Runner crashes with YAML error**
Your pipeline YAML is malformed. Check indentation — YAML is whitespace sensitive. Every step must have exactly `name`, `image`, and `run`.

---

## Testing manually

With Express running, trigger a job and watch the runner:

```bash
# terminal 1 — Express
node ../flowdeploy-api/index.js

# terminal 2 — Runner
python runner.py

# terminal 3 — Trigger a job (replace values)
curl -X POST http://localhost:5000/api/jobs/trigger/PIPELINE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected runner output:
```
[runner] Found 1 queued job(s)
[runner] Starting job abc123
━━━ Step: Say Hello ━━━
$ Starting step: Say Hello
$ Image: alpine
$ Pulling image alpine...
Hello from FlowDeploy!
✓ Step passed: Say Hello
━━━ Pipeline PASSED ━━━
[runner] Job abc123 finished — passed
```