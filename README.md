# ECO Pulse (HackUPC 2026)

Adaptive Urban Cooling & Waste Management Platform

**Team:** Cuatro en Raya

**Teammates:** Sofija Starcevic, Iria Ceballos, Jana Pons, Cay Casas
_________________________________________________________________

This project is an IoT platform designed to improve the climate resilience and logistical efficiency of Barcelona. Using real-time sensors, computer vision models, and a dynamic web interface, our system solves two major urban problems: heatwave mitigation and waste collection optimization.

_________________________________________________________________

## Core Features

### 1. Smart Urban Cooling (Data Dashboard)

A real-time environmental monitoring dashboard designed to actively mitigate heat islands without wasting natural resources.

- Hybrid Sensor Network: Combines live hardware data (Sensor 1 - Arduino Modulino) with simulated city-wide nodes (Passeig de Gràcia, Barceloneta) to demonstrate massive scalability.
- Algorithmic Heat Index: We don't just rely on raw temperature. The backend calculates the true "Feels Like" temperature using the official NOAA (National Oceanic and Atmospheric Administration) Rothfusz regression equation, factoring in humidity penalties.
- Automated Actuators (LEDs & Sprinklers):
	- **OK**: Normal conditions. The system conserves energy.
	- **WARNING** (30°C - 34.9°C): Medium-power water diffusers are activated to lower the ambient temperature (Yellow LED).
	- **CRITICAL** (≥ 35°C, ≤ 70% Humidity): Extreme heatstroke risk. Diffusers operate at maximum capacity (Red LED).
- Computer Vision for Resource Conservation: Cooling empty streets is a waste of water. We integrated a Logitech webcam running an Edge Impulse ML Object Detection model. The cooling system only triggers if human presence is detected, calculating and displaying the exact percentage of water saved in real-time.

### 2. Dynamic Waste Logistics (Containers Map)

An interactive geographic system designed to overhaul traditional, inefficient garbage collection routes.

- Time-of-Flight Fill Estimation: Arduino distance sensors mounted on container lids continuously measure the depth of the trash, converting millimeter readings into an accurate "Fill Percentage".
- Live Operations Map: A Leaflet.js-powered map plots both real and simulated containers across the city.
- Smart Routing: The system automatically flags containers that exceed maximum capacity thresholds (e.g., > 80%), generating targeted collection lists. This prevents garbage trucks from visiting empty bins, saving fuel, time, and reducing CO2 emissions.

_____________________________________________________

## System Architecture & Tech Stack

This project features a robust, non-blocking architecture separating hardware polling, machine learning inference, and UI updates.

### Hardware Edge:
- Arduino Plug and Make Kit:
	- Modulino Thermo: High-precision Temperature & Humidity data.
	- Modulino Distance: Time-of-Flight sensor for waste capacity.
	- Modulino Pixels: Visual state indicators mimicking the diffuser hardware.
- Camera: Logitech Brio 105 for live video stream capture.

### Backend & Machine Learning:
- Python Engine: Handles business logic, threading, and mathematical processing.
- Arduino Bricks Library: Facilitates seamless Bridge RPC communication between the C++ MCU and the Python environment.
- Edge Impulse: Custom-deployed vision model for real-time pedestrian detection (VideoObjectDetection with dynamic debouncing).

### Frontend (Smart Dashboard)
- Real-Time Data Sync: Socket.io (WebSockets) instantly pushes state changes from the Python server to the UI without page reloads.
- Data Visualization: Chart.js implemented with intelligent downsampling (subsampling data to prevent browser lag over 24-hour periods).
- Mapping: Leaflet.js with custom dynamic markers.

__________________________________________________________

## Gallery

### Arduino hardware setup:
<img width="4080" height="3060" alt="20260426_060338" src="https://github.com/user-attachments/assets/1471ae1e-d8d8-4f91-b8da-7704b1535980" />

### Screenshots of the DATA tab:
<img width="1887" height="782" alt="Captura de pantalla 2026-04-26 064708" src="https://github.com/user-attachments/assets/a56bbf22-9013-47ac-b940-e9492b108de7" />

<img width="1873" height="844" alt="Captura de pantalla 2026-04-26 064626" src="https://github.com/user-attachments/assets/322aea65-1982-46c4-b62e-34a360c673a0" />

<img width="1864" height="580" alt="Captura de pantalla 2026-04-26 064500" src="https://github.com/user-attachments/assets/1966d421-053d-4557-9ce9-bc56eb35d319" />

### Screenshot of the RECYCLING tab:
<img width="1834" height="866" alt="image" src="https://github.com/user-attachments/assets/83f7ac10-f54e-42ec-87b0-e2ebc4f491d9" />
