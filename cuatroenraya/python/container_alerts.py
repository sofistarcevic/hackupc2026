FILL_THRESHOLD = 80


def get_full_containers(containers):
    return [
        container for container in containers
        if container.get("fill_percent", 0) >= FILL_THRESHOLD
    ]
