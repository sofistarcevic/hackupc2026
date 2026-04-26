import requests


def meters_to_km(meters):
    return round(meters / 1000, 2)


def get_distance_matrix_from_osrm(locations):
    coords = ";".join([f"{loc['lon']},{loc['lat']}" for loc in locations])

    url = (
        f"http://router.project-osrm.org/table/v1/driving/"
        f"{coords}?annotations=distance"
    )

    response = requests.get(url, timeout=5)
    data = response.json()

    distances = data["distances"]

    matrix = {}

    for i, from_location in enumerate(locations):
        matrix[from_location["id"]] = {}

        for j, to_location in enumerate(locations):
            matrix[from_location["id"]][to_location["id"]] = distances[i][j]

    return matrix


def get_route_geometry_from_osrm(points):
    if len(points) < 2:
        return None

    coords = ";".join([f"{point['lon']},{point['lat']}" for point in points])

    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{coords}?overview=full&geometries=geojson"
    )

    response = requests.get(url, timeout=5)
    data = response.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        return None

    return data["routes"][0]["geometry"]


def get_distance(matrix, from_id, to_id):
    return matrix[from_id][to_id]


def nearest_neighbor(containers, matrix, depot_id):
    pending = containers.copy()
    route = []
    current = depot_id

    while pending:
        next_container = min(
            pending,
            key=lambda c: get_distance(matrix, current, c["id"])
        )

        route.append(next_container)
        pending.remove(next_container)
        current = next_container["id"]

    return route


def route_distance(route, matrix, depot_id):
    total = 0
    current = depot_id

    for container in route:
        total += get_distance(matrix, current, container["id"])
        current = container["id"]

    total += get_distance(matrix, current, depot_id)

    return total


def optimize_route_with_osrm(full_containers, depot):
    if not full_containers:
        return {
            "route": [],
            "distance_km": 0,
            "geometry": None,
            "message": "No hi ha contenidors per recollir"
        }

    locations = [depot] + full_containers
    matrix = get_distance_matrix_from_osrm(locations)

    ordered_route = nearest_neighbor(
        full_containers,
        matrix,
        depot["id"]
    )

    distance_m = route_distance(
        ordered_route,
        matrix,
        depot["id"]
    )

    points = [depot] + ordered_route + [depot]
    geometry = get_route_geometry_from_osrm(points)

    return {
        "route": ordered_route,
        "distance_km": meters_to_km(distance_m),
        "geometry": geometry,
        "message": "Ruta calculada"
    }
