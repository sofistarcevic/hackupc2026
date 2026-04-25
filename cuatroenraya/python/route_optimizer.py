import requests

MAX_ROUTE_DISTANCE_KM = 8


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


def build_route(truck_id, containers, matrix, depot_id):
    route = nearest_neighbor(containers, matrix, depot_id)
    distance_m = route_distance(route, matrix, depot_id)

    return {
        "truck_id": truck_id,
        "route": route,
        "distance_km": meters_to_km(distance_m)
    }


def split_groups(containers, number_of_trucks):
    containers = sorted(
        containers,
        key=lambda c: c.get("fill_percent", 0),
        reverse=True
    )

    groups = [[] for _ in range(number_of_trucks)]

    for index, container in enumerate(containers):
        groups[index % number_of_trucks].append(container)

    return groups


def optimize_routes_with_osrm(full_containers, trucks, depot):
    if not full_containers:
        return {
            "routes": [],
            "message": "No hi ha contenidors per recollir"
        }

    locations = [depot] + full_containers
    matrix = get_distance_matrix_from_osrm(locations)

    one_truck_route = build_route(
        trucks[0]["id"],
        full_containers,
        matrix,
        depot["id"]
    )

    if one_truck_route["distance_km"] <= MAX_ROUTE_DISTANCE_KM:
        return {
            "routes": [one_truck_route],
            "message": "1 camió suficient"
        }

    number_of_trucks = min(len(trucks), len(full_containers))
    groups = split_groups(full_containers, number_of_trucks)

    routes = []

    for index, group in enumerate(groups):
        if not group:
            continue

        routes.append(
            build_route(
                trucks[index]["id"],
                group,
                matrix,
                depot["id"]
            )
        )

    return {
        "routes": routes,
        "message": f"{len(routes)} camions necessaris"
    }
