import json
import os

from arduino.app_utils import App, Bridge
from arduino.app_bricks.web_ui import WebUI

_ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ui")    #Calcula la ruta a la carpeta ui
ui = WebUI(assets_dir_path=_ui_dir)        #Crea la interfaz web (ui)

state = {"temperature": 0.0, "humidity": 0.0}

def _call_mcu(method, *args):        #Llama a una función del Arduino
    try:
        return json.loads(Bridge.call(method, *args))        #Convierte la respuesta JSON en Python
    except Exception as exc:
        print(f"[bridge] {method} error: {exc}")
        return None


def _broadcast(new_state, room=None):
    if new_state and "error" not in new_state:
        state.update(new_state)    #Actualiza el estado global
        ui.send_message("state_update", state, room=room)    #Envía los datos "state" a la interfaz web con el evento "state_update"


def on_connect(sid):    #sid = ID del cliente
    _broadcast(_call_mcu("get_state"), room=sid)    #Cuando alguien abre la web, pide al arduino el estado actual y se lo envia al cliente


def on_sensor_reading(temperature: float, humidity: float):
    state["temperature"] = round(temperature, 1)
    state["humidity"]    = round(humidity, 1)        #Actualiza temperatura y humedad
    ui.send_message("state_update", state)           #Envía datos a todos los clientes conectados


ui.on_connect(on_connect)

Bridge.provide("sensor_reading", on_sensor_reading)

App.run()
