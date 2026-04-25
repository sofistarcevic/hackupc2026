#include <Arduino_RouterBridge.h>
#include <Arduino_Modulino.h>

ModulinoThermo thermo;
ModulinoPixels pixels;

unsigned long last_read_ms = 0;                 //último momento en que se leyó el sensor
const unsigned long READ_INTERVAL_MS = 2000;    //intervalo entre lecturas = 2s
struct RgbColor { uint8_t r, g, b; };

//estado de los leds:
uint8_t brightness = 25;  // 0-100
uint8_t led_r[8] = {0};
uint8_t led_g[8] = {0};
uint8_t led_b[8] = {0};

volatile int anim_mode = 0; // 0 = off, 1 = hue wheel, 2 = sweep

volatile bool leds_changed = false;
String last_state_json = "{\"temperature\": 0.0, \"humidity\": 0.0}";

String rpc_get_state() {    //RPC = Remote Procedure Call
  return last_state_json;   //devuelve la memoria caché, sin tocar el sensor
}

String rpc_set_pixel(int index, int r, int g, int b, int bright) {
  if (index < 0 || index > 7) return "{\"error\":\"index must be 0-7\"}";
  anim_mode = 0;
  brightness = constrain(bright, 0, 100);
  led_r[index] = constrain(r, 0, 255);
  led_g[index] = constrain(g, 0, 255);
  led_b[index] = constrain(b, 0, 255);
  
  leds_changed = true;
  return last_state_json;
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
  unsigned long now = millis();    //tiempo desde que arrancó el Arduino

  if (leds_changed) {
    applyAll();
    leds_changed = false;
  }
  
  if (now - last_read_ms >= READ_INTERVAL_MS) {
    last_read_ms = now;
    
    float t = thermo.getTemperature();
    float h = thermo.getHumidity();
    
    last_state_json = "{\"temperature\": " + String(t, 1) + ", \"humidity\": " + String(h, 1) + "}";
    
    Bridge.notify("sensor_reading", t, h);
  }
}
