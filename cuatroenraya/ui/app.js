// --- CONFIGURACIÓN Y ESTADO GLOBAL ---
const CONFIG_GRAFICA = (label, color, bgColor) => ({
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label,
            data: [],
            borderColor: color,
            backgroundColor: bgColor,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0 
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, 
        animation: false, 
        plugins: { legend: { position: 'top' } },
        scales: { 
            y: { min: 0, max: 100 }, 
            x: { display: false } 
        }
    }
});

let sensorSeleccionado = 'real';
let marcadores = {}; 
let contadorMuestras = 0; 
const MAX_PUNTOS_1H = 720;     
const MAX_PUNTOS_24H = 1440;   

// --- INICIALIZACIÓN DE GRÁFICAS (Chart.js) ---
const graficaTemp = new Chart(document.getElementById('graficaTemperatura'), CONFIG_GRAFICA('Temperature (°C)', '#ce1a1a', 'rgba(206, 26, 26, 0.2)'));
const graficaHumedad = new Chart(document.getElementById('graficaHumedad'), CONFIG_GRAFICA('Humidity (%)', '#2330a1', 'rgba(35, 48, 161, 0.2)'));

const UI = {
    temp: document.getElementById('temp-actual-display'),
    hum: document.getElementById('humedad-actual-display'),
    badge: document.getElementById("badge-conexion"),
    textoBadge: document.getElementById("texto-conexion"),
    tituloSensor: document.getElementById("titulo-sensor-activo"),
    pillReal: document.getElementById("status-real"),
    bolaTemp: document.getElementById('valor-bola-temp'),
    bolaPorcentaje: document.getElementById('valor-bola-porcentaje'),
    wrapBolas: document.querySelectorAll('.indicador-circular-wrap'),
    basura: document.getElementById('basura-actual-display')
};

// --- LÓGICA DE RECYCLING (Pines Dinámicos con filtro > 80%) ---
let mapaBasuras;
let capaMarcadoresBasura = L.layerGroup(); 

function inicializarMapaReciclaje() {
    if (mapaBasuras) return;
    mapaBasuras = L.map('mapa-reciclaje').setView([41.3889, 2.1131], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaBasuras);
    capaMarcadoresBasura.addTo(mapaBasuras);
}

function actualizarMapaReciclajeDinamico(contenedores) {
    if (!mapaBasuras) return;
    capaMarcadoresBasura.clearLayers(); // Limpiar mapa

    contenedores.forEach(container => {
        // DECISIÓN: Solo si el porcentaje es mayor o igual a 80
        if (container.fill_percent >= 80) {
            const posicion = [container.lat, container.lon];
            const marcador = L.marker(posicion)
                .bindPopup(`
                    <div style="text-align: center;">
                        <b style="color: #e74c3c;">¡CONTENEDOR LLENO!</b><br>
                        <b>${container.name}</b><br>
                        Llenado: ${container.fill_percent}%<br>
                        Distancia: ${container.distance_cm}cm
                    </div>
                `);
            capaMarcadoresBasura.addLayer(marcador);
        }
    });
}

// --- LÓGICA DE DATOS REALES (Sensor 1) ---
function applyState(state) {
    const t = parseFloat(state.temperature);
    const h = parseFloat(state.humidity);
    const horaFull = state.time ? state.time.split('T')[1].split('.')[0] : new Date().toLocaleTimeString().slice(0, 8);
    const horaCorta = horaFull.slice(0, 5);

    // Actualizar UI si el Sensor 1 está activo
    if (sensorSeleccionado === 'real') {
        const estalvi = parseFloat(state.saving_percentage) || 0;
        const feeling = parseFloat(state.feels_like);
        if(UI.temp) UI.temp.textContent = t.toFixed(1);
        if(UI.hum) UI.hum.textContent = h.toFixed(1);
        if(UI.bolaTemp) UI.bolaTemp.textContent = feeling.toFixed(1);
        if(UI.bolaPorcentaje) UI.bolaPorcentaje.textContent = estalvi.toFixed(1); 
        document.getElementById('circulo-porcentaje').style.setProperty('--water-fill', estalvi + '%');
        updateCharts(t, h, horaFull.slice(3, 8));
        if (UI.pillReal) actualizarVisualPill("status-real", parseInt(state.diffuser_state));
    }

    // Actualizar Recycling
    if (state.trash_level !== undefined && UI.basura) {
        UI.basura.textContent = parseFloat(state.trash_level).toFixed(1);
        UI.basura.style.color = parseFloat(state.trash_level) >= 80 ? "#e74c3c" : "#08310a";
    }
    if (state.full_containers) {
        actualizarMapaReciclajeDinamico(state.full_containers);
    }
}

// --- SENSORES SIMULADOS Y MAPA PRINCIPAL ---
const DATOS_SIMULADOS = {
    'falso1': { nombre: 'Sensor 2 (P. Gràcia)', indice: 199, historialTemp: Array.from({length: 250}, () => 22 + Math.random() * 10), historialHum: Array.from({length: 250}, () => 40 + Math.random() * 20) },
    'falso2': { nombre: 'Sensor 3 (Barceloneta)', indice: 199, historialTemp: Array.from({length: 250}, () => 28 + Math.random() * 12), historialHum: Array.from({length: 250}, () => 60 + Math.random() * 25) }
};

function seleccionarSensor(id, nombre) {
    sensorSeleccionado = id;
    UI.tituloSensor.textContent = `SHOWING DATA FROM ${nombre.toUpperCase()}`;
    UI.wrapBolas.forEach(el => el.style.display = (id === 'real') ? 'block' : 'none');

    graficaTemp.data.datasets[0].data = []; graficaHumedad.data.datasets[0].data = [];
    graficaTemp.data.labels = []; graficaHumedad.data.labels = [];

    if (id === 'real') {
        UI.temp.textContent = "--"; UI.hum.textContent = "--";
    } else {
        const d = DATOS_SIMULADOS[id];
        UI.temp.textContent = d.historialTemp[d.indice].toFixed(1);
        UI.hum.textContent = d.historialHum[d.indice].toFixed(1);
        for (let i = 0; i < 200; i++) {
            let idx = (d.indice - 199 + i + d.historialTemp.length) % d.historialTemp.length;
            graficaTemp.data.datasets[0].data.push(d.historialTemp[idx]);
            graficaHumedad.data.datasets[0].data.push(d.historialHum[idx]);
            graficaTemp.data.labels.push(""); graficaHumedad.data.labels.push("");
        }
    }
    graficaTemp.update(); graficaHumedad.update();
    actualizarColorPines(id);
}

function simularPasoTiempo() {
    Object.keys(DATOS_SIMULADOS).forEach(key => {
        const sensor = DATOS_SIMULADOS[key];
        sensor.indice = (sensor.indice + 1) % sensor.historialTemp.length;
        actualizarVisualPill(`status-${key}`, evaluarCondicionesCalor(sensor.historialTemp[sensor.indice], sensor.historialHum[sensor.indice]));
        if (sensorSeleccionado === key) {
            UI.temp.textContent = sensor.historialTemp[sensor.indice].toFixed(1);
            UI.hum.textContent = sensor.historialHum[sensor.indice].toFixed(1);
            updateCharts(sensor.historialTemp[sensor.indice], sensor.historialHum[sensor.indice], new Date().toLocaleTimeString().slice(3, 8));
        }
    });
}

function updateCharts(t, h, label) {
    graficaTemp.data.datasets[0].data.push(t); graficaHumedad.data.datasets[0].data.push(h);
    graficaTemp.data.labels.push(label); graficaHumedad.data.labels.push(label);
    if (graficaTemp.data.datasets[0].data.length > 200) {
        graficaTemp.data.datasets[0].data.shift(); graficaHumedad.data.datasets[0].data.shift();
        graficaTemp.data.labels.shift(); graficaHumedad.data.labels.shift();
    }
    graficaTemp.update('none'); graficaHumedad.update('none');
}

// --- NAVEGACIÓN Y UTILIDADES ---
function cambiarPestana(idPestana, botonClicado) {
    document.querySelectorAll('.contenido-pestana, .pestana').forEach(el => el.classList.remove('activa'));
    document.getElementById(idPestana).classList.add('activa');
    botonClicado.classList.add('activa');
    if (idPestana === 'DATA') setTimeout(() => mapa.invalidateSize(), 200);
    if (idPestana === 'RECYCLING') setTimeout(() => { inicializarMapaReciclaje(); mapaBasuras.invalidateSize(); }, 200);
}

function evaluarCondicionesCalor(temp, hum) {
    if (temp < 30 || hum > 85) return 0;
    if (temp >= 35 && hum <= 70) return 2;
    return 1;
}

function actualizarVisualPill(elementId, dState) {
    const pill = document.getElementById(elementId); if (!pill) return;
    const clases = ["status-ok", "status-warning", "status-critical"];
    const textos = ["OK", "WARNING", "CRITICAL"];
    pill.className = `status-pill ${clases[dState] || 'status-ok'}`;
    pill.textContent = textos[dState] || 'OK';
}

function actualizarColorPines(idActivo) {
    Object.keys(marcadores).forEach(key => {
        const icono = marcadores[key]._icon;
        if (icono) { icono.classList.toggle('pin-activo', key === idActivo); icono.classList.toggle('pin-inactivo', key !== idActivo); }
    });
}

// Inicialización Mapa Principal
let mapa = L.map('mi-mapa').setView([41.3886, 2.1497], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
marcadores.real = L.marker([41.3889, 2.1131]).addTo(mapa).on('click', () => seleccionarSensor('real', 'Sensor 1 (UPC)'));
marcadores.falso1 = L.marker([41.3965, 2.1598]).addTo(mapa).on('click', () => seleccionarSensor('falso1', 'Sensor 2 (P. Gràcia)'));
marcadores.falso2 = L.marker([41.3778, 2.1920]).addTo(mapa).on('click', () => seleccionarSensor('falso2', 'Sensor 3 (Barceloneta)'));

// Socket y Tiempos
setInterval(simularPasoTiempo, 3000); 
var socket = io();
socket.on("connect", () => { if (UI.badge) { UI.badge.className = "badge connected"; UI.textoBadge.textContent = "CONNECTED"; } });
socket.on("state_update", applyState);
setTimeout(() => actualizarColorPines('real'), 600);
