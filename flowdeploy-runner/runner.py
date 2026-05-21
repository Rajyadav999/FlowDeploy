import time
import requests
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

from yaml_parser import parse_pipeline
from docker_executor import run_step
from log_streamer import stream_log, update_job_status

API_BASE_URL  = os.getenv('API_BASE_URL', 'http://127.0.0.1:5000')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', 5))


def fetch_queued_jobs():
    try:
        res = requests.get(
            f"{API_BASE_URL}/api/jobs/queued",
            timeout=5
        )
        if res.status_code == 200:
            return res.json()
        return []
    except requests.exceptions.RequestException:
        return []


def fetch_pipeline(pipeline_id: str):
    try:
        res = requests.get(
            f"{API_BASE_URL}/api/pipelines/internal/{pipeline_id}",
            timeout=5
        )
        if res.status_code == 200:
            return res.json()
        print(f"[runner] Pipeline fetch failed: {res.status_code} {res.text}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[runner] Pipeline fetch error: {e}")
        return None


def run_job(job: dict):
    job_id      = job['_id']
    pipeline_id = job['pipeline']

    print(f"[runner] Starting job {job_id}")

    started_at = datetime.now(timezone.utc).isoformat()
    update_job_status(job_id, 'running', started_at=started_at)
    stream_log(job_id, "━━━ FlowDeploy pipeline started ━━━", "system")

    pipeline = fetch_pipeline(pipeline_id)
    if not pipeline:
        stream_log(job_id, "✗ Could not fetch pipeline definition", "system", 'stderr')
        update_job_status(job_id, 'failed', finished_at=datetime.now(timezone.utc).isoformat())
        return

    try:
        config = parse_pipeline(pipeline['yamlContent'])
    except ValueError as e:
        stream_log(job_id, f"✗ YAML error: {e}", "system", 'stderr')
        update_job_status(job_id, 'failed', finished_at=datetime.now(timezone.utc).isoformat())
        return

    steps        = config.get('steps', [])
    env_vars     = config.get('env', {})
    step_results = []
    job_passed   = True

    

# run each step in order
for step in steps:
    step_name  = step['name']
    step_start = datetime.now(timezone.utc)

    stream_log(job_id, f"\n━━━ Step: {step_name} ━━━", step_name)

    passed = run_step(
        job_id,
        step,
        env_vars,
        repo_url=pipeline.get('repoUrl'),
        commit_sha=job.get('commitSha')
    )

    step_end      = datetime.now(timezone.utc)
    duration_secs = round((step_end - step_start).total_seconds(), 1)

    stream_log(job_id, f"⏱ Duration: {duration_secs}s", step_name)

    step_results.append({
        'name':       step_name,
        'status':     'passed' if passed else 'failed',
        'startedAt':  step_start.isoformat(),
        'finishedAt': step_end.isoformat(),
        'duration':   duration_secs
    })

    if not passed:
        job_passed = False
        stream_log(job_id, f"✗ Pipeline stopped at: {step_name}", "system", 'stderr')
        break

    # ── final status ──────────────────────────────────
    final_status = 'passed' if job_passed else 'failed'
    finished_at  = datetime.now(timezone.utc).isoformat()
    stream_log(job_id, f"\n━━━ Pipeline {final_status.upper()} ━━━", "system")

    update_job_status(
        job_id,
        status=final_status,
        steps=step_results,
        finished_at=finished_at
    )

    print(f"[runner] Job {job_id} finished — {final_status}")


# ── Main polling loop ─────────────────────────────────
print(f"[runner] FlowDeploy Python runner started")
print(f"[runner] Polling {API_BASE_URL} every {POLL_INTERVAL}s")

while True:
    jobs = fetch_queued_jobs()

    if jobs:
        print(f"[runner] Found {len(jobs)} queued job(s)")
        for job in jobs:
            run_job(job)
    else:
        print(f"[runner] No queued jobs — waiting...")

    time.sleep(POLL_INTERVAL)