import docker
from log_streamer import stream_log

client = docker.from_env()

def run_step(job_id: str, step: dict, env_vars: dict = {}, repo_url: str = None, commit_sha: str = None) -> bool:
    step_name = step['name']
    image     = step['image']
    command   = step['run']

    stream_log(job_id, f"$ Starting step: {step_name}", step_name)
    stream_log(job_id, f"$ Image: {image}", step_name)
    stream_log(job_id, f"$ Command: {command}", step_name)

    container = None
    try:
        stream_log(job_id, f"$ Pulling image {image}...", step_name)
        client.images.pull(image)

        # build the full command — clone repo first, then run the step command
        if repo_url:
            sha = commit_sha or 'HEAD'
            full_command = f"""
                apk add --no-cache git 2>/dev/null || apt-get install -y git 2>/dev/null || true
                git clone {repo_url} /workspace
                cd /workspace
                git checkout {sha} 2>/dev/null || true
                {command}
            """
            stream_log(job_id, f"$ Cloning repo: {repo_url}", step_name)
        else:
            full_command = command

        container = client.containers.run(
            image=image,
            command=f'sh -c "{full_command}"',
            environment=env_vars,
            detach=True,
            remove=False,
            mem_limit='512m',
            network_mode='bridge'
        )

        for log_line in container.logs(stream=True, follow=True):
            line = log_line.decode('utf-8').strip()
            if line:
                stream_log(job_id, line, step_name)

        result   = container.wait()
        exit_code = result.get('StatusCode', 1)

        if exit_code == 0:
            stream_log(job_id, f"✓ Step passed: {step_name}", step_name)
            return True
        else:
            stream_log(job_id, f"✗ Step failed: {step_name} (exit code {exit_code})", step_name, 'stderr')
            return False

    except docker.errors.ImageNotFound:
        stream_log(job_id, f"✗ Image not found: {image}", step_name, 'stderr')
        return False
    except Exception as e:
        stream_log(job_id, f"✗ Unexpected error: {e}", step_name, 'stderr')
        return False
    finally:
        if container:
            try:
                container.remove(force=True)
            except Exception:
                pass