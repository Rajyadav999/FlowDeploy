import requests
import os

API_BASE_URL = os.getenv('API_BASE_URL', 'http://127.0.0.1:5000')

def stream_log(job_id: str, line: str, step_name: str, stream: str = 'stdout'):
    """
    Sends a single log line to the Express API.
    Express then pushes it to the React dashboard via SSE.
    """
    try:
        requests.post(
            f"{API_BASE_URL}/api/logs/{job_id}",
            json={
                'line': line,
                'stepName': step_name,
                'stream': stream
            },
            timeout=5
        )
    except requests.exceptions.RequestException:
        # never crash the runner because of a log failure
        pass


def update_job_status(job_id: str, status: str, steps: list = None,
                       started_at: str = None, finished_at: str = None):
    """
    Tells Express the current job status.
    Express saves it to MongoDB.
    """
    try:
        payload = {'status': status}
        if steps:       payload['steps'] = steps
        if started_at:  payload['startedAt'] = started_at
        if finished_at: payload['finishedAt'] = finished_at

        requests.patch(
            f"{API_BASE_URL}/api/jobs/{job_id}/status",
            json=payload,
            timeout=5
        )
    except requests.exceptions.RequestException as e:
        print(f"Failed to update job status: {e}")