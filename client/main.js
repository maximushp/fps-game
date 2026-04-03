import { Player } from "./player.js";
import { Enemy } from "./enemy.js";

const socket = io("https://fps-game-q3i8.onrender.com");

let scene = new THREE.Scene();
window.scene = scene;

scene.background = new THREE.Color(0x202020);

let camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// 🌍 LUZ
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
scene.add(light);

// 🧱 CHÃO (MAIS VISÍVEL)
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x666666 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 🧱 OBSTÁCULOS (CAIXAS)
let boxes = [];

for (let i = 0; i < 20; i++) {
  let box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );

  box.position.set(
    Math.random() * 40 - 20,
    1,
    Math.random() * 40 - 20
  );

  scene.add(box);
  boxes.push(box);
}

// 🔫 ARMA
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.2, 1),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);

gun.position.set(0.3, -0.3, -0.8);
camera.add(gun);
scene.add(camera);

// 💥 FLASH
const flash = new THREE.PointLight(0xffaa00, 2, 3);
gun.add(flash);
flash.visible = false;
window.flash = flash;

// 👤 PLAYER
let player = new Player(camera, socket);

// 🤖 INIMIGOS (BOTS)
let enemies = [];

for (let i = 0; i < 5; i++) {
  enemies.push(new Enemy(scene));
}

// 👥 MULTIPLAYER
let others = {};

socket.on("state", players => {
  Object.values(players).forEach(p => {
    if (p.id === socket.id) return;

    if (!others[p.id]) {
      let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      );

      scene.add(mesh);
      others[p.id] = mesh;
    }

    others[p.id].position.set(p.x, p.y, p.z);
  });
});

socket.on("disconnectPlayer", id => {
  if (others[id]) {
    scene.remove(others[id]);
    delete others[id];
  }
});

// 🎮 START
document.getElementById("start").onclick = () => {
  document.body.requestPointerLock();
  start.style.display = "none";
};

// 🔁 LOOP
function animate() {
  requestAnimationFrame(animate);

  player.update();

  // 🤖 atualizar bots
  enemies.forEach(e => e.update(player));

  // 🌐 enviar posição
  socket.emit("move", {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  });

  renderer.render(scene, camera);
}

animate();

// 🔄 RESIZE
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
