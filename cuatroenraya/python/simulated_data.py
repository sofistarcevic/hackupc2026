def get_simulated_containers():
    return [
        {
            "id": "C2",
            "name": "Sants",
            "zone": 2,
            "lat": 41.377,
            "lon": 2.140,
            "fill_percent": 85
        },
        {
            "id": "C3",
            "name": "Gràcia",
            "zone": 2,
            "lat": 41.403,
            "lon": 2.150,
            "fill_percent": 45
        },
        {
            "id": "C4",
            "name": "Barceloneta",
            "zone": 3,
            "lat": 41.380,
            "lon": 2.189,
            "fill_percent": 92
        }
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
