var socket = io();

var statusEl     = document.getElementById("status");
var temperatureEl = document.getElementById("temperature");
var humidityEl    = document.getElementById("humidity");
var lastUpdatedEl = document.getElementById("last-updated");

// Connection status
socket.on("connect",       function () { statusEl.className = "status connected";    statusEl.textContent = "● Connected";    });
socket.on("disconnect",    function () { statusEl.className = "status disconnected"; statusEl.textContent = "● Disconnected"; });
socket.on("connect_error", function () { statusEl.className = "status connecting";   statusEl.textContent = "Connecting…";    });

// State from server
socket.on("state_update", function (data) {
  if (data) applyState(data);
});

function applyState(state) {
  temperatureEl.textContent = parseFloat(state.temperature).toFixed(1);
  humidityEl.textContent    = parseFloat(state.humidity).toFixed(1);
  lastUpdatedEl.textContent = new Date().toLocaleTimeString();
}
