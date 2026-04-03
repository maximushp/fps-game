const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// 🔧 CONFIG
const TICK_RATE = 50; // ms (20 updates por segundo)
const FIRE_RATE = 150; // ms entre tiros
const DAMAGE = 20;
const RANGE = 6;

// 🚀 INIT
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 📦 ESTADO DOS PLAYERS
let players = {};

// 📏 DISTÂNCIA
function distance(a, b) {
  return Math.sqrt(
    (a.x - b.x) ** 2 +
    (a.y - b.y) ** 2 +
    (a.z - b.z) ** 2
  );
}

// 🔄 CONEXÃO
io.on("connection", (socket) => {
  console.log("Player conectado:", socket.id);

  // 🧍 CRIA PLAYER
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * 10,
    y: 1.6,
    z: Math.random() * 10,
    rotY: 0,
    health: 100,
    lastShot: 0
  };

  // 📡 ENVIA ESTADO INICIAL
  socket.emit("init", players);

  // 📍 MOVIMENTO
  socket.on("move", (data) => {
    const p = players[socket.id];
    if (!p) return;

    // validação básica
    if (
      typeof data.x !== "number" ||
      typeof data.y !== "number" ||
      typeof data.z !== "number"
    ) return;

    p.x = data.x;
    p.y = data.y;
    p.z = data.z;
    p.rotY = data.rotY;
  });

  // 🔫 TIRO
  socket.on("shoot", () => {
    const shooter = players[socket.id];
    if (!shooter) return;

    const now = Date.now();

    // 🚫 anti-spam
    if (now - shooter.lastShot < FIRE_RATE) return;

    shooter.lastShot = now;

    // 🎯 HIT DETECTION (simples)
    Object.values(players).forEach((target) => {
      if (target.id === socket.id) return;

      const dist = distance(shooter, target);

      if (dist < RANGE) {
        target.health -= DAMAGE;

        // 💀 MORTE + RESPAWN
        if (target.health <= 0) {
          target.health = 100;
          target.x = Math.random() * 10;
          target.z = Math.random() * 10;

          io.emit("playerKilled", {
            killer: socket.id,
            victim: target.id
          });
        }

        // ❤️ ATUALIZA VIDA
        io.emit("playerHit", {
          target: target.id,
          health: target.health
        });
      }
    });
  });

  // ❌ DESCONECTAR
  socket.on("disconnect", () => {
    console.log("Player saiu:", socket.id);

    delete players[socket.id];

    io.emit("playerDisconnected", socket.id);
  });
});

// 🔁 LOOP GLOBAL (SYNC)
setInterval(() => {
  io.emit("state", players);
}, TICK_RATE);

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
