#include <Arduino_RouterBridge.h>
#include <Arduino_Modulino.h>
#include <math.h>

ModulinoThermo thermo;
ModulinoPixels pixels;
ModulinoDistance distance;

unsigned long last_read_ms = 0;                 //último momento en que se leyó el sensor
const unsigned long READ_INTERVAL_MS = 2000;    //intervalo entre lecturas = 5s
struct RgbColor { uint8_t r, g, b; };

float t = 0.0;
float h = 0.0;
int dist_mm = 0;
int in_range = 0;

String last_state_json = "{\"temperature\": 0.0, \"humidity\": 0.0, \"distance\": 0, \"in_range\": 0}";

//estado de los leds:
uint8_t brightness = 25;  // 0-100
uint8_t led_r[8] = {0};
uint8_t led_g[8] = {0};
uint8_t led_b[8] = {0};
  
volatile int anim_mode = 0; // 0 = off, 1 = hue wheel, 2 = sweep
volatile bool leds_changed = false;

String buildState(float t, float h, int dist_mm, int in_range){
  return "{\"temperature\": " + String(t,1) + 
         ", \"humidity\": " + String(h,1) +
         ", \"distance\": " + String(dist_mm) +
         ", \"in_range\": " + String(in_range) + "}";
}

String rpc_get_state() {    //RPC = Remote Procedure Call
  distance.available();
  float val = distance.get();
  int in_range = isnan(val) ? 0 : 1;
  int dist_mm = in_range ? (int)val : 0;

  last_state_json = buildState(t, h, dist_mm, in_range);
  return last_state_json;
}

String rpc_set_pixel(int index, int r, int g, int b, int bright) {
  if (index < 0 || index > 7) return "{\"error\":\"index must be 0-7\"}";
  anim_mode = 0;
  brightness = constrain(bright, 0, 100);
  led_r[index] = constrain(r, 0, 255);
  led_g[index] = constrain(g, 0, 255);
  led_b[index] = constrain(b, 0, 255);
  
  leds_changed = true;

  last_state_json = buildState(t, h, dist_mm, in_range);
  return last_state_json;
}

void applyAll() {
  for (int i = 0; i < 8; i++) {
    pixels.set(i, ModulinoColor(led_r[i], led_g[i], led_b[i]), brightness);
  }
  pixels.show();
}


void setup() {
  Serial.begin(9600);
  Bridge.begin();
  Modulino.begin();
  thermo.begin();
  pixels.begin();
  distance.begin();

  Bridge.provide("get_state", rpc_get_state);
  Bridge.provide("set_pixel", rpc_set_pixel);
}

void loop() {
  unsigned long now = millis();    //tiempo desde que arrancó el Arduino

  if(distance.available()){
    float val = distance.get();
    in_range = isnan(val) ? 0 : 1;
    dist_mm = in_range ? (int)val : 0;
  }

  Serial.print(dist_mm);
  
  if (leds_changed) {
    applyAll();
    leds_changed = false;
  }
  
  if (now - last_read_ms >= READ_INTERVAL_MS) {
    last_read_ms = now;
    
    t = thermo.getTemperature();
    h = thermo.getHumidity();
    
    last_state_json = buildState(t, h, dist_mm, in_range);
    
    Bridge.notify("sensor_reading", t, h, dist_mm, in_range);
  }
}
