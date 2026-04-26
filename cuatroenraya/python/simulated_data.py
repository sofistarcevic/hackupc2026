# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

# Copyright (c) 2026 CuatroEnRaya Team

EMPTY_DISTANCE_CM = 100
FULL_DISTANCE_CM = 5

def calculate_simulated_fill_percent(distance_cm):
    fill = 100 * (EMPTY_DISTANCE_CM - distance_cm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)
    return max(0, min(100, round(fill, 1)))

def build_simulated_container(container_id, name, lat, lon, distance_cm):
    return {
        "id": container_id,
        "name": name,
        "lat": lat,
        "lon": lon,
        "distance_cm": distance_cm,
        "fill_percent": calculate_simulated_fill_percent(distance_cm)
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
            65
        ),
        build_simulated_container(
            "C4",
            "Barceloneta",
            41.380,
            2.189,
            12
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
