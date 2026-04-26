# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

# Copyright (c) 2026 CuatroEnRaya Team

FILL_THRESHOLD = 80

def get_full_containers(containers):
    return [
        container for container in containers
        if container.get("fill_percent", 0) >= FILL_THRESHOLD
    ]
