import json
import os
import traceback
import threading
#import cv2

from arduino.app_utils import App, Bridge
from arduino.app_bricks.web_ui import WebUI
from arduino.app_bricks.video_objectdetection import VideoObjectDetection
from datetime import datetime, UTC
from heat_decision import evaluate_heat_conditions
#from person_detection import detect_person, initialize_detection

_ui_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ui")    #Calcula ruta a la carpeta ui
ui = WebUI(assets_dir_path=_ui_dir)                                               #Crea interfaz web (ui)

state = {"temperature": 0.0, "humidity": 0.0, "time": "", "diffuser_state": 0, "heatwave_alert": False, "person_detection": False}




video_detector = VideoObjectDetection(confidence=0.4, debounce_sec=1.5)

def on_person_detected():
    print("Person detected!")
        
video_detector.on_detect("person", on_person_detected)



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

def on_connect(sid):                                #sid = ID del cliente
    _broadcast(_call_mcu("get_state"), room=sid)    #Cuando alguien abre la web, pide al arduino el estado actual y se lo envia al cliente

def on_sensor_reading(temperature: float, humidity: float):
    state["time"] = datetime.now().isoformat()
    state["temperature"] = round(temperature, 1)
    state["humidity"] = round(humidity, 1)          #Actualiza temperatura y humedad

    diffuser_state, heatwave_alert = evaluate_heat_conditions(temperature, humidity)
    state["diffuser_state"] = diffuser_state
    state["heatwave_alert"] = heatwave_alert

    ui.send_message("state_update", state)          #Envía datos a todos los clientes conectados    

    import threading

    def update_led():
        if diffuser_state == 1:
            Bridge.call("set_pixel", 0, 255, 255, 0, 50)   #amarillo con brightness medio
        elif diffuser_state == 2:
            Bridge.call("set_pixel", 0, 255, 0, 0, 100)    #rojo con brightness màximo
        else:
            Bridge.call("set_pixel", 0, 0, 0, 0, 0)        #apagado

    threading.Thread(target=update_led).start()

ui.on_connect(on_connect)

Bridge.provide("sensor_reading", on_sensor_reading)

App.run()
