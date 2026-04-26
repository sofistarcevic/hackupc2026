import json
import os
import traceback
import threading
import time

from arduino.app_utils import App, Bridge
from arduino.app_bricks.web_ui import WebUI
from arduino.app_bricks.video_objectdetection import VideoObjectDetection
from datetime import datetime, UTC
from heat_decision import evaluate_heat_conditions

from container_alerts import get_full_containers
from simulated_data import get_simulated_containers


_ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ui")    #Calcula ruta a la carpeta ui
ui = WebUI(assets_dir_path=_ui_dir)                                               #Crea interfaz web (ui)

state = {
    "temperature": 0.0,
    "humidity": 0.0,
    "distance": 0.0,
    "in_range": 0,
    "time": "",
    "diffuser_state": 0,
    "heatwave_alert": False,
    "person_detection": False,
    "total_heat_cases": 0,
    "real_activations": 0,
    "avoided_activations": 0,
    "saving_percentage": 0.0,
    "feels_like": 0.0,
    "container_id": "C_REAL",
    "container_name": "Contenidor Arduino",
    "container_lat": 41.389,
    "container_lon": 2.113,
    "fill_percent": 0.0,
    "full_containers": []

}

EMPTY_DISTANCE_CM = 100
FULL_DISTANCE_CM = 5

# --- CONTAINERS ---
simulated_containers = get_simulated_containers()
def calculate_fill_percent(distance_cm):
    fill = 100 * (EMPTY_DISTANCE_CM - distance_cm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)
    return max(0, min(100, round(fill, 1)))

def get_real_container():
    return {
        "id": state["container_id"],
        "name": state["container_name"],
        "lat": state["container_lat"],
        "lon": state["container_lon"],
        "distance_cm": state["distance"],
        "fill_percent": state["fill_percent"]
    }

def update_full_containers_list():
    all_containers = [get_real_container()] + simulated_containers
    full_containers = get_full_containers(all_containers)

    state["full_containers"] = full_containers

    print("\n--- CONTENIDORS A RECOLLIR ---")
    for container in full_containers:
        print(f"{container['name']} -> {container['fill_percent']}%")


# --- PART DE LA CAMARA ---
last_seen_time = 0
TIMEOUT_PERSON = 1.0

video_detector = VideoObjectDetection(confidence=0.4, debounce_sec=1.5)

def on_person_detected():
    global last_seen_time
    last_seen_time = time.time()
    
    if not state["person_detection"]:
        print("Person detected!")
        state["person_detection"] = True
        ui.send_message("state_update", state)
        
video_detector.on_detect("person", on_person_detected)

def check_person_timeout():
    global last_seen_time
    while True:
        if state["person_detection"] and (time.time() - last_seen_time > TIMEOUT_PERSON):
            print("Empty room.")
            state["person_detection"] = False
            ui.send_message("state_update", state)
        
        time.sleep(1)

threading.Thread(target=check_person_timeout, daemon=True).start()
threading.Thread(target=video_detector.start, daemon=True).start()

# --- BRIDGE COMUNICACIÓN ---
def _call_mcu(method, *args):
    try:
        return json.loads(Bridge.call(method, *args))        #Convierte la respuesta JSON en Python
    except Exception as exc:
        print(f"[bridge] {method} error: {exc}")
        return None

def _broadcast(new_state, room=None):
    if new_state and "error" not in new_state:
        new_state["time"] = datetime.now().isoformat()
        state.update(new_state)                              #Actualiza el estado global
        ui.send_message("state_update", state, room=room)    #Envía los datos "state" a la interfaz web con el evento "state_update"

def on_connect(sid):                                         #sid = ID del cliente
    _broadcast(_call_mcu("get_state"), room=sid)             #Cuando alguien abre la web, pide al arduino el estado actual y se lo envia al cliente

def on_sensor_reading(temperature: float, humidity: float, dist_mm: int, in_range: int):
    state["time"] = datetime.now().isoformat()
    state["temperature"] = round(temperature, 1)
    state["humidity"] = round(humidity, 1)
    
    state["distance"] = round(dist_mm / 10.0, 1)    #convertim a cm
    state["in_range"] = in_range

    print(f"Distancia en cm: {state['distance']} (En rango: {in_range})")

    state["fill_percent"] = calculate_fill_percent(state["distance"])
    update_full_containers_list()

    diffuser_state, heatwave_alert = evaluate_heat_conditions(temperature, humidity)
    state["diffuser_state"] = diffuser_state
    state["heatwave_alert"] = heatwave_alert

    if diffuser_state == 1 or diffuser_state == 2:
        state["total_heat_cases"] += 1
    
        if state["person_detection"]:
            state["real_activations"] += 1
        else:
            state["avoided_activations"] += 1
    
        if state["total_heat_cases"] > 0:
            state["saving_percentage"] = round(
                (state["avoided_activations"] / state["total_heat_cases"]) * 100,
                2
            )
    
    alivio = 0
    if diffuser_state == 1:
        alivio = 2.0
    elif diffuser_state == 2:
        alivio = 5.0

    #si la humedad es muy alta, el agua no alivia, solo moja
    if humidity > 80:
        alivio = alivio * 0.2 # Reducimos el efecto del agua al 20%

    #cálculo sensación térmica
    feels_like = (temperature + (0.55 * (humidity / 100) * (temperature - 14.5))) - alivio

    state["feels_like"] = round(feels_like, 1)

    ui.send_message("state_update", state)          #Envía datos a todos los clientes conectados    

    def update_led():
        if diffuser_state == 1 and state["person_detection"]:
            Bridge.call("set_pixel", 0, 255, 255, 0, 50)   #amarillo con brightness medio
        elif diffuser_state == 2:
            Bridge.call("set_pixel", 0, 255, 0, 0, 100)    #rojo con brightness máximo
        else:
            Bridge.call("set_pixel", 0, 0, 0, 0, 0)        #apagado

    threading.Thread(target=update_led).start()

ui.on_connect(on_connect)

Bridge.provide("sensor_reading", on_sensor_reading)

App.run()
