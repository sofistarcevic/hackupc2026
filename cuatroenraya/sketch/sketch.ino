#include <Arduino_RouterBridge.h>
#include <Arduino_Modulino.h>

ModulinoThermo thermo;
ModulinoPixels pixels;

unsigned long last_read_ms = 0;    //último momento en que se leyó el sensor
const unsigned long READ_INTERVAL_MS = 2000;    //intervalo entre lecturas = 2s
struct RgbColor { uint8_t r, g, b; };

//led state:
uint8_t brightness = 25;  // 0-100
uint8_t led_r[8] = {0};
uint8_t led_g[8] = {0};
uint8_t led_b[8] = {0};

volatile int anim_mode = 0; // 0 = off, 1 = hue wheel, 2 = sweep

String buildState() {
  float temperature = thermo.getTemperature();    //leemos temperatura
  float humidity  = thermo.getHumidity();       //leemos humedad
  return "{\"temperature\": " + String(temperature, 1) +
         ", \"humidity\": "   + String(humidity,  1) + "}";    //string en formato JSON: {"temperature": x, "humidity": y}
}

String rpc_get_state() {    //RPC = Remote Procedure Call
  return buildState();      //devuelve estado actual del sensor en JSON
}

String rpc_set_pixel(int index, int r, int g, int b, int bright) {
  if (index < 0 || index > 7) return "{\"error\":\"index must be 0-7\"}";
  anim_mode = 0;
  brightness = constrain(bright, 0, 100);
  led_r[index] = constrain(r, 0, 255);
  led_g[index] = constrain(g, 0, 255);
  led_b[index] = constrain(b, 0, 255);
  applyAll();
  return buildState();
}

void applyAll() {
  for (int i = 0; i < 8; i++) {
    pixels.set(i, ModulinoColor(led_r[i], led_g[i], led_b[i]), brightness);
  }
  pixels.show();
}

void setup() {
  Bridge.begin();
  Modulino.begin();
  thermo.begin();
  pixels.begin();

  Bridge.provide("get_state", rpc_get_state);
  Bridge.provide("set_pixel", rpc_set_pixel);
}

void loop() {
  Bridge.update();
  
  unsigned long now = millis();    //tiempo desde que arrancó el Arduino
  if (now - last_read_ms >= READ_INTERVAL_MS) {    //comprueba si han pasado 2s desde la última lectura
    last_read_ms = now;
    Bridge.notify("sensor_reading", thermo.getTemperature(), thermo.getHumidity());  //manda evento "sensor_reading" con temp y hum
  }
}
