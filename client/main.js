import { Player } from "./player.js";
import { Enemy } from "./enemy.js";

const socket = io("https://fps-game-q3i8.onrender.com");

// ================= SCENE =================
let scene = new THREE.Scene();
window.scene = scene;

// céu
scene.background = new THREE.Color(0x87ceeb);

// câmera
let camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

// render
let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(1);
document.body.appendChild(renderer.domElement);

// luz
scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.2));

// ================= TEXTURAS =================
const loader = new THREE.TextureLoader();

// chão
const groundTexture = loader.load("https://threejs.org/examples/textures/terrain/grasslight-big.jpg");
groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50,50);

let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(500,500),
  new THREE.MeshStandardMaterial({ map: groundTexture })
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// caixas
const boxTexture = loader.load("https://threejs.org/examples/textures/crate.gif");

for(let i=0;i<50;i++){
  let box = new THREE.Mesh(
    new THREE.BoxGeometry(2,2,2),
    new THREE.MeshStandardMaterial({ map: boxTexture })
  );

  box.position.set(
    Math.random()*200 - 100,
    1,
    Math.random()*200 - 100
  );

  scene.add(box);
}

// ================= ARMA =================
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3,0.2,1),
  new THREE.MeshStandardMaterial({color:0x222222})
);
gun.position.set(0.3,-0.3,-0.8);
camera.add(gun);
scene.add(camera);

// flash tiro
const flash = new THREE.PointLight(0xffaa00,2,3);
gun.add(flash);
flash.visible = false;
window.flash = flash;

// ================= PLAYER =================
let player = new Player(camera, socket);

// ================= BOTS =================
let enemies = [];
for(let i=0;i<5;i++){
  enemies.push(new Enemy(scene));
}

// ================= MULTIPLAYER =================
let others = {};

socket.on("state", players=>{
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

    others[p.id].position.set(p.x,p.y,p.z);
  });
});

socket.on("disconnectPlayer", id=>{
  if(others[id]){
    scene.remove(others[id]);
    delete others[id];
  }
});

// ================= KILL FEED =================
const killFeed = document.createElement("div");
killFeed.style.position="absolute";
killFeed.style.top="10px";
killFeed.style.right="10px";
killFeed.style.color="white";
killFeed.style.fontSize="14px";
document.body.appendChild(killFeed);

socket.on("killFeed", data=>{
  let msg=document.createElement("div");
  msg.innerText=`${data.killerName} matou ${data.victimName}`;
  killFeed.appendChild(msg);
  setTimeout(()=>msg.remove(),3000);
});

socket.on("playerJoined", data=>{
  let msg=document.createElement("div");
  msg.innerText=`🟢 ${data.name} entrou`;
  killFeed.appendChild(msg);
  setTimeout(()=>msg.remove(),3000);
});

socket.on("playerLeft", data=>{
  let msg=document.createElement("div");
  msg.innerText=`🔴 ${data.name} saiu`;
  killFeed.appendChild(msg);
  setTimeout(()=>msg.remove(),3000);
});

// jogadores já conectados
socket.on("existingPlayers", players=>{
  players.forEach(p=>{
    if(p.id === socket.id) return;

    let msg=document.createElement("div");
    msg.innerText=`🟢 ${p.name} já está no jogo`;
    killFeed.appendChild(msg);

    setTimeout(()=>msg.remove(),3000);
  });
});

// ================= MENU =================
const nicknameInput = document.getElementById("nickname");
const playBtn = document.getElementById("playBtn");
const menu = document.getElementById("menu");

playBtn.onclick = ()=>{
  const name = nicknameInput.value.trim() || "Player";

  socket.emit("setName", name);

  menu.style.display="none";

  document.body.requestPointerLock();
  player.isPlaying = true;
};

// ================= LOOP =================
function animate(){
  requestAnimationFrame(animate);

  player.update();
  enemies.forEach(e=>e.update(player));

  socket.emit("move",{
    x:camera.position.x,
    y:camera.position.y,
    z:camera.position.z
  });

  renderer.render(scene,camera);
}
animate();

// ================= RESIZE =================
window.addEventListener("resize", ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
