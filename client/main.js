import { Player } from "./player.js";

// 🔥 COLOQUE SEU LINK DO RENDER AQUI
const socket = io("https://fps-game-q3i8.onrender.com");

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 🌍 LUZ
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// 🧱 CHÃO
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x555555 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// 🧱 OBJETOS
for (let i = 0; i < 20; i++) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 2),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  box.position.set(
    Math.random() * 40 - 20,
    1,
    Math.random() * 40 - 20
  );
  scene.add(box);
}

// 🔫 ARMA (fixa na câmera)
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.2, 1),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);

gun.position.set(0.3, -0.3, -0.8);
camera.add(gun);
scene.add(camera);

// 👤 PLAYER
let player = new Player(camera, socket);

// 👥 OUTROS PLAYERS
let otherPlayers = {};

socket.on("state", (players) => {
  Object.values(players).forEach((p) => {
    if (p.id === socket.id) return;

    if (!otherPlayers[p.id]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      );
      scene.add(mesh);
      otherPlayers[p.id] = mesh;
    }

    otherPlayers[p.id].position.lerp(
      new THREE.Vector3(p.x, p.y, p.z),
      0.2
    );
  });
});

socket.on("playerDisconnected", (id) => {
  if (otherPlayers[id]) {
    scene.remove(otherPlayers[id]);
    delete otherPlayers[id];
  }
});

// 🖱️ START
const start = document.getElementById("start");

start.addEventListener("click", () => {
  document.body.requestPointerLock();
  start.style.display = "none";
});

// 🔁 LOOP
function animate() {
  requestAnimationFrame(animate);

  player.update();

  socket.emit("move", {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    rotY: camera.rotation.y
  });

  renderer.render(scene, camera);
}

animate();

// 🔄 RESIZE
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
