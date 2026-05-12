# flowdeploy-api

> The Express backend for FlowDeploy — handles authentication, pipeline management, GitHub webhooks, job tracking, and live log streaming via Server-Sent Events.

---

## What this service does

This is the central nervous system of FlowDeploy. Every other service — the Python runner, the React dashboard, and GitHub — talks to this API. It does five things:

- **Auth** — register and login users, issue JWT tokens
- **Pipelines** — store and manage YAML pipeline definitions
- **Webhooks** — receive push events from GitHub and create jobs automatically
- **Jobs** — track every pipeline run with step-level pass/fail status
- **Live logs** — stream log lines from the Python runner to the browser in real time using Server-Sent Events (SSE)

---

## Tech stack

| Tool | Purpose |
|---|---|
| Express.js | HTTP server and routing |
| MongoDB + Mongoose | Database and schemas |
| JWT | User authentication |
| bcryptjs | Password hashing |
| Morgan | Request logging |
| dotenv | Environment variable management |

---

## Folder structure

```
flowdeploy-api/
├── index.js                  ← entry point, boots server + MongoDB
├── package.json
├── .env                      ← secrets (never commit this)
├── routes/
│   ├── auth.js               ← register, login
│   ├── pipelines.js          ← CRUD for pipeline definitions
│   ├── jobs.js               ← trigger runs, track status
│   ├── webhooks.js           ← GitHub push event handler
│   └── logs.js               ← SSE log streaming
├── models/
│   ├── Pipeline.js           ← YAML config + repo info
│   ├── Job.js                ← one run of a pipeline
│   └── LogEntry.js           ← every log line from a run
└── middleware/
    ├── auth.js               ← JWT verification
    └── validate.js           ← request body validation
```

---

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB running locally or via Docker

### Install dependencies
```bash
cd flowdeploy-api
npm install
```

### Set up environment variables
Create a `.env` file inside `flowdeploy-api/`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/flowdeploy
PORT=5000
JWT_SECRET=your_secret_key_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
```

### Start the server
```bash
node index.js
```

### Verify it's running
```bash
curl http://localhost:5000/
# → {"status":"FlowDeploy API running"}
```

---

## API reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Login and receive JWT token |

### Pipelines
> All routes require `Authorization: Bearer <token>` header

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pipelines` | Get all pipelines for logged-in user |
| GET | `/api/pipelines/:id` | Get one pipeline |
| POST | `/api/pipelines` | Create a new pipeline |
| PUT | `/api/pipelines/:id` | Update pipeline YAML or settings |
| DELETE | `/api/pipelines/:id` | Delete a pipeline |
| GET | `/api/pipelines/internal/:id` | Internal route for Python runner — no auth |

### Jobs
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/jobs/queued` | Get all queued jobs — polled by Python runner | No |
| GET | `/api/jobs/pipeline/:id` | Get job history for a pipeline | Yes |
| GET | `/api/jobs/:id` | Get a single job with step details | Yes |
| POST | `/api/jobs/trigger/:pipelineId` | Manually trigger a pipeline run | Yes |
| PATCH | `/api/jobs/:id/status` | Update job status — called by Python runner | No |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhooks/github` | GitHub push event receiver |

### Logs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/logs/:jobId` | Open SSE stream — browser connects here |
| POST | `/api/logs/:jobId` | Push a log line — Python runner calls this |

---

## How SSE log streaming works

The browser opens a persistent GET connection to `/api/logs/:jobId`. Express keeps this connection alive and pushes each log line the moment it arrives from the Python runner. The Python runner sends log lines via POST to the same endpoint. Express saves each line to MongoDB (for page refresh) and simultaneously pushes it to all open browser connections watching that job.

```
Python runner → POST /api/logs/:jobId → Express → SSE push → Browser
```

---

## How GitHub webhooks work

1. You configure a webhook in your GitHub repo pointing to `POST /api/webhooks/github`
2. Every time code is pushed, GitHub sends a signed HTTP POST to this endpoint
3. Express verifies the HMAC-SHA256 signature using your `GITHUB_WEBHOOK_SECRET`
4. If the repo URL and branch match an active pipeline, a new job is created automatically
5. The Python runner picks it up within 5 seconds and starts executing

---

## Key design decisions

**Why JWT over sessions?** The Python runner and React frontend are separate services — JWT lets any service verify identity without sharing session state.

**Why SSE over WebSockets?** Log streaming is one-directional (server to browser). SSE is simpler, requires no handshake, and works natively in every browser without extra libraries.

**Why an internal pipeline route?** The Python runner needs to fetch pipeline YAML to execute it, but it has no user JWT token. A separate internal route without auth keeps the runner simple without compromising user security.

---

## Testing the API manually

```bash
# register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"luffy","email":"luffy@test.com","password":"123456"}'

# login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"luffy@test.com","password":"123456"}'

# create pipeline (replace TOKEN)
curl -X POST http://localhost:5000/api/pipelines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"my-app","repoUrl":"https://github.com/user/repo","branch":"main","yamlContent":"name: my-app\nsteps:\n  - name: Say Hello\n    image: alpine\n    run: echo Hello!"}'

# trigger a run (replace PIPELINE_ID and TOKEN)
curl -X POST http://localhost:5000/api/jobs/trigger/PIPELINE_ID \
  -H "Authorization: Bearer TOKEN"
```