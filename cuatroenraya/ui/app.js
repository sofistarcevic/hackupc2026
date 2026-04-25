// --- CONFIGURACIÓN Y ESTADO ---
// maintainAspectRatio: false permite que la gráfica use todo el alto del div CSS
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
        scales: { y: { suggestedMin: 20, suggestedMax: 30 } }
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

// --- LÓGICA DE DATOS ---
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

function applyState(state) {
    // Solo actualizamos si el sensor activo en el mapa es el 'real'
    if (sensorSeleccionado !== 'real') return; 

    const t = parseFloat(state.temperature);
    const h = parseFloat(state.humidity);
    const hora = state.time ? state.time.split('T')[1].split('.')[0] : "--:--";

    if(UI.temp) UI.temp.textContent = t.toFixed(1);
    if(UI.hum) UI.hum.textContent = h.toFixed(1);

    updateCharts(t, h, hora);

    // Actualizar Pill de Estado en la leyenda
    if (UI.pillReal) {
        const dState = parseInt(state.diffuser_state);
        const clases = ["status-ok", "status-warning", "status-critical"];
        const textos = ["OK", "WARNING", "CRITICAL"];
        
        UI.pillReal.className = `status-pill ${clases[dState] || 'status-ok'}`;
        UI.pillReal.textContent = textos[dState] || 'OK';
    }
}

// --- MAPA ---
let mapa = L.map('mi-mapa').setView([41.380, 2.075], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapa);

marcadores.real = L.marker([41.385, 2.070]).addTo(mapa).bindPopup("Sensor 1 (Principal)");
marcadores.falso1 = L.marker([41.375, 2.080]).addTo(mapa).bindPopup("Sensor 2 (Norte)");
marcadores.falso2 = L.marker([41.382, 2.085]).addTo(mapa).bindPopup("Sensor 3 (Invernadero)");

function seleccionarSensor(id, nombre, t = null, h = null) {
    sensorSeleccionado = id;
    if(UI.tituloSensor) UI.tituloSensor.textContent = `SHOWING DATA FROM ${nombre.toUpperCase()}`;

    // Limpiar gráficas actuales
    graficaTemp.data.datasets[0].data = [];
    graficaHumedad.data.datasets[0].data = [];
    graficaTemp.data.labels = [];
    graficaHumedad.data.labels = [];

    if (id === 'real') {
        UI.temp.textContent = "--";
        UI.hum.textContent = "--";
    } else {
        UI.temp.textContent = t.toFixed(1);
        UI.hum.textContent = h.toFixed(1);
        // Llenamos la gráfica con el valor fijo para que no salga vacía
        for(let i=0; i<10; i++) updateCharts(t, h, "FIXED");
    }
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

// --- CONEXIÓN SOCKET ---
var socket = io();
socket.on("connect", () => actualizarEstadoConexion('connected', 'CONNECTED'));
socket.on("disconnect", () => actualizarEstadoConexion('disconnected', 'DISCONNECTED'));
socket.io.on("reconnect_attempt", () => actualizarEstadoConexion('connecting', 'CONNECTING...'));
socket.on("state_update", applyState);

// --- EVENTOS DE CLIC ---
marcadores.real.on('click', () => seleccionarSensor('real', 'Sensor 1'));
marcadores.falso1.on('click', () => seleccionarSensor('falso1', 'Sensor 2', 22.0, 45.0));
marcadores.falso2.on('click', () => seleccionarSensor('falso2', 'Sensor 3', 26.0, 80.0));

// Iluminar pin inicial
setTimeout(() => actualizarColorPines('real'), 600);
