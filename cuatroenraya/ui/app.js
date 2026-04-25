//Funcionamiento de las pestañas
function cambiarPestana(idPestana, botonClicado) {
    const contenidos = document.querySelectorAll('.contenido-pestana');
    contenidos.forEach(seccion => {
        seccion.classList.remove('activa');
    });

    const botones = document.querySelectorAll('.pestana');
    botones.forEach(boton => {
        boton.classList.remove('activa');
    });

    document.getElementById(idPestana).classList.add('activa');
    botonClicado.classList.add('activa');
}

//Funcionamiento de las grtaficas y de los números gigantes

const lienzo = document.getElementById('graficaTemperatura');
const displaytemp = document.getElementById('temp-actual-display');

const lienzo2 = document.getElementById('graficaHumedad');
const displayhum = document.getElementById('humedad-actual-display');

const tituloEstado = document.getElementById("estado-conexion");

// Datos de prueba
let etiquetasTiempo = [];
let datosTemperatura = [];
let datosHumedad = [];

let graficaTemp = new Chart(lienzo, {
    type: 'line',
    data: {
        labels: etiquetasTiempo,
        datasets: [{
            label: 'Temperatura (°C)',
            data: datosTemperatura,
            borderColor: '#ce1a1a',
            backgroundColor: 'rgba(95, 33, 33, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4 // curva suave
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'top' }
        },
        scales: {
            y: { 
                beginAtZero: false,
                suggestedMin: 20, 
                suggestedMax: 30
            }
        }
    }
});

let graficaHumedad = new Chart(lienzo2, {
    type: 'line',
    data: {
        labels: etiquetasTiempo,
        datasets: [{
            label: 'Humedad (%)',
            data: datosHumedad,
            borderColor: '#2330a1', 
            backgroundColor: 'rgba(40, 42, 160, 0.2)', 
            borderWidth: 2,
            fill: true,
            tension: 0.4 // Curva suave
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'top' }
        },
        scales: {
            y: { 
                beginAtZero: false,
                suggestedMin: 20, 
                suggestedMax: 30
            }
        }
    }
});

var socket = io();

socket.on("connect", function () { 
    if(tituloEstado) { 
        tituloEstado.textContent = "Conectado, esperando datos..."; 
        tituloEstado.style.color = "#215f24";
    }
    console.log("¡Conectado al servidor!");
});

socket.on("disconnect", function () { 
    if(tituloEstado) { 
        tituloEstado.textContent = "Desconectado"; 
        tituloEstado.style.color = "#ce1a1a";
    }
});

socket.on("state_update", function (data) {
    if (data) {
        if(tituloEstado) { 
            tituloEstado.textContent = "Recibiendo datos en tiempo real..."; 
            tituloEstado.style.color = "#2980b9";
        }
        applyState(data);
    }
});

function applyState(state) {
    let nuevaTemp = parseFloat(state.temperature);
    let nuevaHum = parseFloat(state.humidity);

    let tiempoCompleto = state.time;
    let nuevaHora = tiempoCompleto.split('T')[1].split('.')[0];

    datosTemperatura.push(nuevaTemp);
    datosHumedad.push(nuevaHum);
    etiquetasTiempo.push(nuevaHora);

    if (datosTemperatura.length > 10) {
        datosTemperatura.shift();
        datosHumedad.shift();
        etiquetasTiempo.shift();
    }

    if(displaytemp) displaytemp.textContent = nuevaTemp.toFixed(1);
    if(displayhum) displayhum.textContent = nuevaHum.toFixed(1);

    // 6. ¡Le decimos a Chart.js que redibuje las gráficas con los nuevos datos!
    graficaTemp.update();
    graficaHumedad.update();
}
