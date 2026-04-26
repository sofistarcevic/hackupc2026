# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

# Copyright (c) 2026 CuatroEnRaya Team

from arduino.app_bricks.video_objectdetection import VideoObjectDetection

# Carrega el vostre model Edge Impulse local
detection_stream = VideoObjectDetection(
    model_path="./detector_persona.eim",
    confidence=0.5,
    debounce_sec=2.0
)

# variable global
person_detected = False


def _person_callback():
    global person_detected
    person_detected = True
    print("Person detected")


def initialize_detection():
    """
    Inicialitza el detector i registra el callback
    """
    detection_stream.on_detect("person", _person_callback)


def detect_person():
    """
    Retorna True si s'ha detectat persona
    Retorna False si no
    """
    global person_detected

    current_state = person_detected

    # reset pel següent cicle
    person_detected = False

    return current_state
