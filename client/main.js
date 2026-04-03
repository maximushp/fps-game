import { Player } from "./player.js";
import { Enemy } from "./enemy.js";

// 🔥 SEU SERVIDOR
const socket = io("https://fps-game-q3i8.onrender.com");

let scene = new THREE.Scene();
window.scene = scene;

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

// 🧱 CAIXAS
for (let i = 0; i < 20; i++) {
  let box = new THREE.Mesh(
    new THREE.BoxGeometry(2,2,2),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  box.position.set(Math.random()*40-20,1,Math.random()*40-20);
  scene.add(box);
}

// 🔫 ARMA
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3,0.2,1),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
gun.position.set(0.3,-0.3,-0.8);
camera.add(gun);
scene.add(camera);

// 👤 PLAYER
let player = new Player(camera, socket);

// 🤖 BOTS
let enemies = [];
for (let i=0;i<5;i++){
  enemies.push(new Enemy(scene));
}

// 👥 MULTIPLAYER
let others = {};

socket.on("state", players => {
  Object.values(players).forEach(p=>{
    if(p.id === socket.id) return;

    if(!others[p.id]){
      let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1,2,1),
        new THREE.MeshStandardMaterial({color:0x00ff00})
      );
      scene.add(mesh);
      others[p.id] = mesh;
    }

    others[p.id].position.lerp(
      new THREE.Vector3(p.x,p.y,p.z),
      0.2
    );
  });
});

socket.on("playerDisconnected", id=>{
  if(others[id]){
    scene.remove(others[id]);
    delete others[id];
  }
});

// START
document.getElementById("start").onclick = ()=>{
  document.body.requestPointerLock();
  document.getElementById("start").style.display="none";
};

// LOOP
function animate(){
  requestAnimationFrame(animate);

  player.update();

  enemies.forEach(e=>e.update(player));

  socket.emit("move",{
    x:camera.position.x,
    y:camera.position.y,
    z:camera.position.z,
    rotY:camera.rotation.y
  });

  renderer.render(scene,camera);
}
animate();

// RESIZE
window.addEventListener("resize",()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
