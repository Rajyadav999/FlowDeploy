# FlowDeploy 🚀

> A self-hosted CI/CD pipeline platform — built from scratch. Define pipelines in YAML, run each step in isolated Docker containers, and watch live logs stream to your browser in real time.


## What is FlowDeploy?

FlowDeploy is a GitHub Actions-like CI/CD platform that you can self-host and run entirely on your own infrastructure. Instead of relying on third-party CI tools, you define your pipeline in a simple YAML file, push your code, and FlowDeploy takes care of the rest — running every step in a clean, isolated Docker container and streaming the output live to your dashboard.

**The short version:** You write the recipe. FlowDeploy cooks it — step by step, in real time, in front of you.


## Features

- **YAML pipeline definitions** — define steps, Docker images, commands, and environment variables in a clean, readable format
- **Isolated Docker execution** — every pipeline step runs in its own fresh container, deleted after completion
- **Live log streaming** — watch build output appear in real time via Server-Sent Events, no page refresh needed
- **GitHub webhook integration** — push to a branch and your pipeline triggers automatically
- **Build history** — every run is stored with step-level pass/fail status, duration, and full logs
- **JWT authentication** — users own their pipelines, all routes protected
- **GitHub OAuth** — connect your repo in one click
- **Embeddable status badge** — paste a live SVG badge into any README
- **Pipeline analytics** — average build time, failure rate per step, success rate over time
- **Slack notifications** — get alerted on build failure with step name and error snippet
- **Fully containerized** — one `docker compose up` command spins the entire stack locally

---

## Architecture

```
GitHub (push event)
      │
      │  webhook
      ▼
 Express API  ──────────────────────────────►  React Dashboard
 (Node.js)          SSE log stream              (live logs UI)
      │
      │  job trigger
      ▼
 Python Runner
 (YAML parser + Docker orchestrator)
      │
      ├──► Step 1 Container (node:18)
      ├──► Step 2 Container (node:18)
      └──► Step 3 Container (node:18)
```

**Express API** receives the GitHub webhook, saves the job to MongoDB, tells the Python runner to start, and keeps an SSE connection open to stream logs to the browser.

**Python Runner** reads your `pipeline.yml`, spins a fresh Docker container for each step using the Docker SDK, captures stdout/stderr line by line, and streams it back to Express in real time.

**React Dashboard** renders a terminal-style UI that shows live logs as they arrive, pipeline history, step-level status, and analytics charts.

**Docker socket mount** (`/var/run/docker.sock`) gives the Python runner the ability to spin containers from inside a container — the same technique used by GitHub Actions internally.

---

## Pipeline YAML syntax

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

  - name: Build app
    image: node:18
    run: npm run build
```

Each step runs in a completely isolated Docker container. If a step exits with a non-zero code, the pipeline stops immediately and marks the build as failed.

---

## Tech stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Pipeline dashboard, live log terminal |
| API | Express (Node.js) | REST API, webhook receiver, SSE streaming |
| Runner | Python 3.11 | YAML parser, Docker orchestrator, job queue |
| Database | MongoDB | Pipelines, jobs, log entries |
| Proxy | Nginx | Reverse proxy, SSE buffering config |
| DevOps | Docker + Docker Compose | Local dev, containerization |
| Auth | JWT + GitHub OAuth | User auth, pipeline ownership |
| CI/CD | GitHub Actions | FlowDeploy's own pipeline (dogfooding) |

---

## Getting started

### Prerequisites

- Docker and Docker Compose installed
- A GitHub account (for OAuth and webhooks)
- WSL2 recommended if on Windows

### 1. Clone the repo

```bash
git clone https://github.com/your-username/flowdeploy.git
cd flowdeploy
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGO_URI=mongodb://mongo:27017/flowdeploy
PORT=5000
JWT_SECRET=your_secret_key_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
API_BASE_URL=http://api:5000
```

### 3. Start the stack

```bash
docker compose up --build
```

This spins up 4 containers: MongoDB, Express API, Python runner, and the React frontend.

### 4. Open the dashboard

Visit `http://localhost:3000` — create an account, connect your GitHub repo, and create your first pipeline.

---

## Project structure

```
flowdeploy/
├── docker-compose.yml
├── .env
├── nginx/
│   └── nginx.conf
├── flowdeploy-api/          # Express backend
│   ├── routes/
│   │   ├── pipelines.js
│   │   ├── jobs.js
│   │   ├── webhooks.js
│   │   └── logs.js          # SSE endpoint
│   └── models/
│       ├── Pipeline.js
│       ├── Job.js
│       └── LogEntry.js
├── flowdeploy-runner/       # Python orchestrator
│   ├── runner.py
│   ├── yaml_parser.py
│   ├── docker_executor.py
│   └── log_streamer.py
└── flowdeploy-client/       # React dashboard
    └── src/
        ├── pages/
        ├── components/
        │   └── LogTerminal.jsx
        └── hooks/
            └── useLiveLogs.js
```

---

## Key engineering decisions

**Why two backends?** Express handles the API layer — auth, routing, webhook ingestion, SSE streaming — things Node.js does well. Python owns the execution logic — Docker orchestration, YAML parsing, job queuing — because the Docker SDK and async job libraries are richer in the Python ecosystem. The two services communicate via internal HTTP calls.

**Why SSE over WebSockets?** Log streaming is one-directional — server to browser. SSE is the correct protocol for this use case. It's simpler, requires no handshake, and is supported natively by every browser. WebSockets add bidirectional complexity that isn't needed here.

**Why Docker-in-Docker via socket mount?** Mounting `/var/run/docker.sock` into the Python runner container allows it to communicate with the host Docker daemon directly. Each pipeline step gets a completely fresh, isolated container — no state leaks between steps. This is exactly how GitHub Actions self-hosted runners work internally.

**Container cleanup** — every Docker SDK call is wrapped in a `try/finally` block that calls `container.remove(force=True)`. A periodic background job also cleans up any containers older than 10 minutes as a safeguard against edge cases.

---

## Roadmap

- [ ] Parallel step execution (using Python threading)
- [ ] Re-run failed pipelines from the dashboard
- [ ] Kubernetes deployment via Helm chart
- [ ] Pipeline templates library
- [ ] Secrets management UI
- [ ] Multi-branch trigger support

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

```bash
# Run API in development mode
cd flowdeploy-api && npm run dev

# Run Python runner directly
cd flowdeploy-runner && python runner.py

# Run React in development mode
cd flowdeploy-client && npm run dev
```

---

## Author

Built by [Raj Yadav ] 