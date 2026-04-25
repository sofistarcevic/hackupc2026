# container_alerts.py

FILL_THRESHOLD = 80  # percentatge a partir del qual cal recollir

# Distàncies de referència
EMPTY_DISTANCE_CM = 140
FULL_DISTANCE_CM = 5


def calculate_fill_percent(distance_cm):
    """
    Converteix la distància del sensor en percentatge d'ompliment
    """
    fill = 100 * (EMPTY_DISTANCE_CM - distance_cm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)
    return max(0, min(100, round(fill, 1)))


def update_container_fill(container, distance_cm):
    """
    Actualitza el percentatge d'un contenidor
    """
    container["distance_cm"] = distance_cm
    container["fill_percent"] = calculate_fill_percent(distance_cm)
    return container


def get_full_containers(containers):
    """
    Retorna només els contenidors que superen el llindar
    """
    return [
        c for c in containers
        if c.get("fill_percent", 0) >= FILL_THRESHOLD
    ]


def generate_alerts(containers):
    """
    Genera la llista d'avisos (contenidors a recollir)
    """
    full_containers = get_full_containers(containers)

    alerts = []
    for c in full_containers:
        alerts.append({
            "id": c["id"],
            "name": c.get("name", ""),
            "fill_percent": c["fill_percent"],
            "lat": c.get("lat"),
            "lon": c.get("lon")
        })

    return alerts
