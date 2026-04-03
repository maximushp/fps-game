import { Player } from "./player.js";

const socket = io("https://fps-game-q3i8.onrender.com");

let scene = new THREE.Scene();
window.scene = scene;

scene.background = new THREE.Color(0x202020);

let camera = new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

// luz
scene.add(new THREE.HemisphereLight(0xffffff,0x444444));

// chão
let floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50,50),
  new THREE.MeshStandardMaterial({color:0x555555})
);
floor.rotation.x = -Math.PI/2;
scene.add(floor);

// arma
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

// 👥 outros players
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

// player
let player = new Player(camera,socket);

// start
document.getElementById("start").onclick=()=>{
  document.body.requestPointerLock();
  start.style.display="none";
};

// loop
function animate(){
  requestAnimationFrame(animate);

  player.update();

  socket.emit("move",{
    x:camera.position.x,
    y:camera.position.y,
    z:camera.position.z
  });

  renderer.render(scene,camera);
}
animate();
