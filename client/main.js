import { Player } from "./player.js";
import { Enemy } from "./enemy.js";

const socket = io("https://fps-game-q3i8.onrender.com");

// ================= SCENE =================
let scene = new THREE.Scene();
window.scene = scene;

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

const roadTexture = loader.load("https://images.unsplash.com/photo-1507525428034-b723cf961d3e");
roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(4,4);

const buildingTexture = loader.load("https://images.unsplash.com/photo-1494526585095-c41746248156");

// ================= CIDADE =================
const citySize = 200;
const blockSize = 20;

// chão base
let ground = new THREE.Mesh(
  new THREE.PlaneGeometry(citySize, citySize),
  new THREE.MeshStandardMaterial({ color: 0x555555 })
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// ================= OUTDOOR =================
const photoLoader = new THREE.TextureLoader();

const photos = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1503264116251-35a269479413",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d"
];

function createOutdoor(building, img){
  const texture = photoLoader.load(img);

  const outdoor = new THREE.Mesh(
    new THREE.PlaneGeometry(6,4),
    new THREE.MeshStandardMaterial({ map: texture })
  );

  outdoor.position.y = building.geometry.parameters.height * 0.6;

  const side = Math.floor(Math.random()*4);
  const size = 5;

  if(side === 0){
    outdoor.position.set(0, outdoor.position.y, size + 0.01);
  }
  if(side === 1){
    outdoor.position.set(0, outdoor.position.y, -size - 0.01);
    outdoor.rotation.y = Math.PI;
  }
  if(side === 2){
    outdoor.position.set(size + 0.01, outdoor.position.y, 0);
    outdoor.rotation.y = -Math.PI/2;
  }
  if(side === 3){
    outdoor.position.set(-size - 0.01, outdoor.position.y, 0);
    outdoor.rotation.y = Math.PI/2;
  }

  building.add(outdoor);
}

// ================= MAPA =================
for(let x = -citySize/2; x < citySize/2; x += blockSize){
  for(let z = -citySize/2; z < citySize/2; z += blockSize){

    // rua
    let road = new THREE.Mesh(
      new THREE.PlaneGeometry(blockSize, blockSize),
      new THREE.MeshStandardMaterial({ map: roadTexture })
    );

    road.rotation.x = -Math.PI/2;
    road.position.set(x + blockSize/2, 0.01, z + blockSize/2);
    scene.add(road);

    // prédio
    if(Math.random() > 0.3){
      let height = Math.random()*15 + 5;

      let building = new THREE.Mesh(
        new THREE.BoxGeometry(10, height, 10),
        new THREE.MeshStandardMaterial({ map: buildingTexture })
      );

      building.position.set(
        x + blockSize/2,
        height/2,
        z + blockSize/2
      );

      scene.add(building);

      // outdoor
      if(Math.random() > 0.5){
        createOutdoor(
          building,
          photos[Math.floor(Math.random()*photos.length)]
        );
      }
    }
  }
}

// ================= ÁRVORES =================
function createTree(x,z){
  let trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3,0.3,2),
    new THREE.MeshStandardMaterial({color:0x8B4513})
  );

  let leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.5),
    new THREE.MeshStandardMaterial({color:0x228B22})
  );

  trunk.position.set(x,1,z);
  leaves.position.set(x,3,z);

  scene.add(trunk);
  scene.add(leaves);
}

for(let i=0;i<40;i++){
  createTree(
    Math.random()*200 - 100,
    Math.random()*200 - 100
  );
}

// ================= ARMA =================
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3,0.2,1),
  new THREE.MeshStandardMaterial({color:0x222222})
);
gun.position.set(0.3,-0.3,-0.8);
camera.add(gun);
scene.add(camera);

// flash
const flash = new THREE.PointLight(0xffaa00,2,3);
gun.add(flash);
flash.visible=false;
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

// ================= HUD =================
const killFeed = document.createElement("div");
killFeed.style.position="absolute";
killFeed.style.top="10px";
killFeed.style.right="10px";
killFeed.style.color="white";
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
