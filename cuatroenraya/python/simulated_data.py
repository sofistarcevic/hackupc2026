from container_alerts import calculate_fill_percent


def build_simulated_container(container_id, name, lat, lon, distance_cm):
    return {
        "id": container_id,
        "name": name,
        "lat": lat,
        "lon": lon,
        "distance_cm": distance_cm,
        "fill_percent": calculate_fill_percent(distance_cm)
    }


def get_simulated_containers():
    return [
        build_simulated_container(
            "C2",
            "Sants",
            41.377,
            2.140,
            20
        ),
        build_simulated_container(
            "C3",
            "Gràcia",
            41.403,
            2.150,
            100
        ),
        build_simulated_container(
            "C4",
            "Barceloneta",
            41.380,
            2.189,
            10
        )
    ]


def get_trucks():
    return [
        {"id": "truck_1"},
        {"id": "truck_2"}
    ]


def get_depot():
    return {
        "id": "DEPOT",
        "name": "Base camions",
        "lat": 41.389,
        "lon": 2.113
    }
