// --- CONFIGURACIÓN Y ESTADO ---
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
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: { legend: { position: 'top' } },
        scales: { y: { suggestedMin: 20, suggestedMax: 45 } }
    }
});

let sensorSeleccionado = 'real';
let marcadores = {};

// --- INICIALIZACIÓN DE GRÁFICAS ---
// Asegúrate de que estos IDs coincidan con tu HTML: 'graficaTemperatura' y 'graficaHumedad'
const graficaTemp = new Chart(document.getElementById('graficaTemperatura'), CONFIG_GRAFICA('Temperatura (°C)', '#ce1a1a', 'rgba(95, 33, 33, 0.2)'));
const graficaHumedad = new Chart(document.getElementById('graficaHumedad'), CONFIG_GRAFICA('Humedad (%)', '#2330a1', 'rgba(40, 42, 160, 0.2)'));

const UI = {
    temp: document.getElementById('temp-actual-display'),
    hum: document.getElementById('humedad-actual-display'),
    badge: document.getElementById("badge-conexion"),
    textoBadge: document.getElementById("texto-conexion"),
    tituloSensor: document.getElementById("titulo-sensor-activo"),
    pillReal: document.getElementById("status-real")
};

// --- DATOS DE SENSORES SIMULADOS ---
const DATOS_SIMULADOS = {
    'falso1': {
        nombre: 'Sensor 2 (Norte)',
        indice: 0,
        historialTemp: [22.5, 25.0, 28.2, 31.5, 33.0, 34.2, 32.0, 29.5, 26.0, 24.5, 30.5, 33.8],
        historialHum: [45, 48, 50, 55, 60, 58, 55, 52, 50, 48, 54, 57]
    },
    'falso2': {
        nombre: 'Sensor 3 (Invernadero)',
        indice: 0,
        historialTemp: [31.0, 33.5, 35.2, 37.8, 39.5, 36.0, 34.5, 32.0, 35.5, 38.0, 40.2, 33.0],
        historialHum: [65, 68, 62, 55, 50, 58, 60, 65, 55, 52, 48, 60]
    }
};

// --- LÓGICA DE DECISIÓN ---
function evaluarCondicionesCalor(temp, hum) {
    let diffuser_state = 0; // OFF por defecto

    if (temp < 30 || hum > 85) {
        diffuser_state = 0; // OFF
    } else if (temp >= 35 && hum <= 70) {
        diffuser_state = 2; // HIGH
    } else if (temp >= 32 || temp >= 30) {
        diffuser_state = 1; // LOW
    }
    
    return diffuser_state;
}

function actualizarVisualPill(elementId, dState) {
    const pill = document.getElementById(elementId);
    if (!pill) return;

    const clases = ["status-ok", "status-warning", "status-critical"];
    const textos = ["OK", "WARNING", "CRITICAL"];

    // Esto sobreescribe "status-loading" por la clase de color que toque
    pill.className = `status-pill ${clases[dState]}`;
    pill.textContent = textos[dState];
}

// --- FUNCIONES DE INTERFAZ ---
function cambiarPestana(idPestana, botonClicado) {
    document.querySelectorAll('.contenido-pestana, .pestana').forEach(el => el.classList.remove('activa'));
    document.getElementById(idPestana).classList.add('activa');
    botonClicado.classList.add('activa');

    if (idPestana === 'DATA') {
        setTimeout(() => {
            mapa.invalidateSize();
        }, 200);
    }
}

function actualizarEstadoConexion(clase, texto) {
    if (!UI.badge) return;
    UI.badge.className = `badge ${clase}`; 
    UI.textoBadge.textContent = texto;
}

// --- LÓGICA DE ACTUALIZACIÓN DE GRÁFICAS ---
function updateCharts(t, h, label) {
    // Referencia directa a los datasets de cada objeto Chart
    const datasetTemp = graficaTemp.data.datasets[0].data;
    const datasetHum = graficaHumedad.data.datasets[0].data;
    
    // Añadimos datos
    datasetTemp.push(t);
    datasetHum.push(h);
    
    // Añadimos etiquetas (el tiempo) a AMBAS gráficas
    graficaTemp.data.labels.push(label);
    graficaHumedad.data.labels.push(label);

    // Mantenemos solo los últimos 10 puntos
    if (datasetTemp.length > 10) {
        datasetTemp.shift();
        datasetHum.shift();
        graficaTemp.data.labels.shift();
        graficaHumedad.data.labels.shift();
    }

    // Renderizamos los cambios
    graficaTemp.update();
    graficaHumedad.update();
}

// --- SIMULADOR DE MOVIMIENTO (RECORRE LA LISTA) ---
function simularPasoTiempo() {
    Object.keys(DATOS_SIMULADOS).forEach(key => {
        const sensor = DATOS_SIMULADOS[key];
        
        sensor.indice++;
        if (sensor.indice >= sensor.historialTemp.length) {
            sensor.indice = 0;
        }

        const tActual = sensor.historialTemp[sensor.indice];
        const hActual = sensor.historialHum[sensor.indice];

        // 1. Calculamos el estado según la lógica de calor
        const nuevoEstado = evaluarCondicionesCalor(tActual, hActual);

        // 2. Actualizamos el óvalo en la leyenda (siempre, aunque no esté seleccionado)
        actualizarVisualPill(`status-${key}`, nuevoEstado);

        // 3. Si el usuario tiene seleccionado este sensor, actualizar gráficas y displays
        if (sensorSeleccionado === key) {
            UI.temp.textContent = tActual.toFixed(1);
            UI.hum.textContent = hActual.toFixed(1);
            const etiquetaHora = new Date().toLocaleTimeString().slice(3, 8); 
            updateCharts(tActual, hActual, etiquetaHora);
        }
    });
}

// Ejecutar simulador cada 3 segundos
setInterval(simularPasoTiempo, 3000);

// --- LÓGICA DE SOCKET (SENSOR REAL) ---
function applyState(state) {
    if (sensorSeleccionado !== 'real') return; 

    const t = parseFloat(state.temperature);
    const h = parseFloat(state.humidity);
    const hora = state.time ? state.time.split('T')[1].split('.')[0] : "--:--";

    if(UI.temp) UI.temp.textContent = t.toFixed(1);
    if(UI.hum) UI.hum.textContent = h.toFixed(1);

    updateCharts(t, h, hora);

    if (UI.pillReal) {
        const dState = parseInt(state.diffuser_state);
        const clases = ["status-", "status-ok", "status-warning", "status-critical"];
        const textos = ["-", "OK", "WARNING", "CRITICAL"];
        
        UI.pillReal.className = `status-pill ${clases[dState] || 'status-ok'}`;
        UI.pillReal.textContent = textos[dState] || 'OK';
    }
}

// --- MAPA ---
let mapa = L.map('mi-mapa').setView([41.38863075905344, 2.149742538416078], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapa);

marcadores.real = L.marker([41.38895072885124, 2.113178963447162]).addTo(mapa).bindPopup("Sensor 1 (UPC)");
marcadores.falso1 = L.marker([41.396528370927946, 2.1598679960877663]).addTo(mapa).bindPopup("Sensor 2 (Passeig de Gràcia)");
marcadores.falso2 = L.marker([41.37781823573754, 2.1920909114293217]).addTo(mapa).bindPopup("Sensor 3 (Barceloneta beach)");

function seleccionarSensor(id, nombre) {
    sensorSeleccionado = id;
    if(UI.tituloSensor) UI.tituloSensor.textContent = `SHOWING DATA FROM ${nombre.toUpperCase()}`;

    // Limpiar gráficas
    graficaTemp.data.datasets[0].data = [];
    graficaHumedad.data.datasets[0].data = [];
    graficaTemp.data.labels = [];
    graficaHumedad.data.labels = [];

    if (id === 'real') {
        UI.temp.textContent = "--";
        UI.hum.textContent = "--";
        // Al ser real, no llenamos nada, esperamos al socket
    } else {
        const datosSim = DATOS_SIMULADOS[id];
        
        // CORRECCIÓN: Accedemos al valor actual usando el índice del simulador
        const tActual = datosSim.historialTemp[datosSim.indice];
        const hActual = datosSim.historialHum[datosSim.indice];

        UI.temp.textContent = tActual.toFixed(1);
        UI.hum.textContent = hActual.toFixed(1);

        // Llenamos la gráfica con el historial que tenemos
        datosSim.historialTemp.forEach((val, i) => {
            graficaTemp.data.datasets[0].data.push(val);
            graficaTemp.data.labels.push(`T-${10-i}`);
        });
        datosSim.historialHum.forEach((val, i) => {
            graficaHumedad.data.datasets[0].data.push(val);
            graficaHumedad.data.labels.push(`T-${10-i}`);
        });
    }

    graficaTemp.update();
    graficaHumedad.update();
    actualizarColorPines(id);
}


function actualizarColorPines(idActivo) {
    Object.keys(marcadores).forEach(key => {
        const icono = marcadores[key]._icon;
        if (icono) {
            icono.classList.toggle('pin-activo', key === idActivo);
            icono.classList.toggle('pin-inactivo', key !== idActivo);
        }
    });
}

// --- LISTENERS Y CONEXIÓN ---
marcadores.real.on('click', () => seleccionarSensor('real', 'Sensor 1 (UPC)'));
marcadores.falso1.on('click', () => seleccionarSensor('falso1', 'Sensor 2 (Passeig de Gràcia)'));
marcadores.falso2.on('click', () => seleccionarSensor('falso2', 'Sensor 3 (Barceloneta beach)'));

var socket = io();
socket.on("connect", () => actualizarEstadoConexion('connected', 'CONNECTED'));
socket.on("disconnect", () => actualizarEstadoConexion('disconnected', 'DISCONNECTED'));
socket.io.on("reconnect_attempt", () => actualizarEstadoConexion('connecting', 'CONNECTING...'));
socket.on("state_update", applyState);

//Iluminar pin inicial
setTimeout(() => actualizarColorPines('real'), 600);
