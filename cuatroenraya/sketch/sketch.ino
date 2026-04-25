#include <Arduino_RouterBridge.h>
#include <Arduino_Modulino.h>

ModulinoThermo thermo;

unsigned long last_read_ms = 0;    //último momento en que se leyó el sensor
const unsigned long READ_INTERVAL_MS = 2000;    //intervalo entre lecturas = 2s

String buildState() {
  float temperature = thermo.getTemperature();    //leemos temperatura
  float humidity  = thermo.getHumidity();       //leemos humedad
  return "{\"temperature\": " + String(temperature, 1) +
         ", \"humidity\": "   + String(humidity,  1) + "}";    //string en formato JSON: {"temperature": x, "humidity": y}
}

String rpc_get_state() {    //RPC = Remote Procedure Call
  return buildState();      //devuelve estado actual del sensor en JSON
}

void setup() {
  Bridge.begin();
  Modulino.begin();
  thermo.begin();

  Bridge.provide("get_state", rpc_get_state);
}

void loop() {
  unsigned long now = millis();    //tiempo desde que arrancó el Arduino
  if (now - last_read_ms >= READ_INTERVAL_MS) {    //comprueba si han pasado 2s desde la última lectura
    last_read_ms = now;
    Bridge.notify("sensor_reading", thermo.getTemperature(), thermo.getHumidity());  //manda evento "sensor_reading" con temp y hum
  }
}
