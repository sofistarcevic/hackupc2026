import requests

MAX_ROUTE_DISTANCE_KM = 8

def meters_to_km(m):
    return round(m / 1000, 2)

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

    for i, from_loc in enumerate(locations):
        matrix[from_loc["id"]] = {}
        for j, to_loc in enumerate(locations):
            matrix[from_loc["id"]][to_loc["id"]] = distances[i][j]

    return matrix


# ALGORITME DE RUTA
def get_distance(matrix, a, b):
    return matrix[a][b]


def nearest_neighbor(containers, matrix, depot_id):
    pending = containers.copy()
    route = []
    current = depot_id

    while pending:
        next_c = min(
            pending,
            key=lambda c: get_distance(matrix, current, c["id"])
        )
        route.append(next_c)
        pending.remove(next_c)
        current = next_c["id"]

    return route


def route_distance(route, matrix, depot_id):
    if not route:
        return 0

    total = 0
    current = depot_id

    for c in route:
        total += get_distance(matrix, current, c["id"])
        current = c["id"]

    total += get_distance(matrix, current, depot_id)

    return total


def build_route(truck_id, containers, matrix, depot_id):
    route = nearest_neighbor(containers, matrix, depot_id)
    dist_m = route_distance(route, matrix, depot_id)

    return {
        "truck_id": truck_id,
        "route": route,
        "distance_km": meters_to_km(dist_m)
    }


def split_groups(containers, num_trucks):
    containers = sorted(containers, key=lambda c: c["fill_percent"], reverse=True)

    groups = [[] for _ in range(num_trucks)]

    for i, c in enumerate(containers):
        groups[i % num_trucks].append(c)

    return groups


def optimize_routes_with_osrm(full_containers, trucks, depot):
    if not full_containers:
        return {"routes": [], "message": "No hi ha contenidors"}

    locations = [depot] + full_containers
    matrix = get_distance_matrix_from_osrm(locations)

    # 👉 prova amb 1 camió
    one = build_route(trucks[0]["id"], full_containers, matrix, depot["id"])

    if one["distance_km"] <= MAX_ROUTE_DISTANCE_KM:
        return {
            "routes": [one],
            "message": "1 camió suficient"
        }

    # 👉 dividir
    num = min(len(trucks), len(full_containers))
    groups = split_groups(full_containers, num)

    routes = []

    for i, group in enumerate(groups):
        if not group:
            continue

        r = build_route(trucks[i]["id"], group, matrix, depot["id"])
        routes.append(r)

    return {
        "routes": routes,
        "message": f"{len(routes)} camions necessaris"
    }
