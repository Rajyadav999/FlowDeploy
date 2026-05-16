import yaml

def parse_pipeline(yaml_content: str) -> dict:
    """
    Reads the raw YAML string and returns a clean dict.
    Raises ValueError if required fields are missing.
    """
    try:
        config = yaml.safe_load(yaml_content)
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML: {e}")

    # validate required top-level fields
    if not config.get('name'):
        raise ValueError("Pipeline must have a 'name' field")
    if not config.get('steps'):
        raise ValueError("Pipeline must have at least one step")

    # validate each step
    for i, step in enumerate(config['steps']):
        if not step.get('name'):
            raise ValueError(f"Step {i+1} is missing a 'name'")
        if not step.get('image'):
            raise ValueError(f"Step '{step.get('name')}' is missing an 'image'")
        if not step.get('run'):
            raise ValueError(f"Step '{step.get('name')}' is missing a 'run' command")

    return config