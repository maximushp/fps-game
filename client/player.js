export class Player {
  constructor(camera, socket){
    this.camera = camera;
    this.socket = socket;

    this.camera.position.set(0,1.6,5);

    this.health = 100;

    this.speed = 0.15;
    this.sensitivity = 0.002;

    this.move = {f:0,b:0,l:0,r:0};

    // 🔫 armas
    this.weapons = {
      pistol: { damage: 20, fireRate: 400 },
      rifle: { damage: 10, fireRate: 100 }
    };

    this.currentWeapon = "pistol";
    this.lastShot = 0;

    // 🎯 raycast
    this.raycaster = new THREE.Raycaster();

    this.init();
  }

  init(){

    // 🎯 mouse estilo FPS
    document.addEventListener("mousemove", e=>{
      if(document.pointerLockElement){
        this.camera.rotation.y -= e.movementX * this.sensitivity;
        this.camera.rotation.x -= e.movementY * this.sensitivity;

        this.camera.rotation.x = Math.max(
          -Math.PI/2,
          Math.min(Math.PI/2, this.camera.rotation.x)
        );
      }
    });

    // ⌨️ movimento + troca de arma
    document.addEventListener("keydown", e=>{
      if(e.code==="KeyW") this.move.f=1;
      if(e.code==="KeyS") this.move.b=1;
      if(e.code==="KeyA") this.move.l=1;
      if(e.code==="KeyD") this.move.r=1;

      if(e.code==="Digit1"){
        this.currentWeapon="pistol";
        document.getElementById("weapon").innerText="🔫 pistol";
      }

      if(e.code==="Digit2"){
        this.currentWeapon="rifle";
        document.getElementById("weapon").innerText="🔫 rifle";
      }
    });

    document.addEventListener("keyup", e=>{
      if(e.code==="KeyW") this.move.f=0;
      if(e.code==="KeyS") this.move.b=0;
      if(e.code==="KeyA") this.move.l=0;
      if(e.code==="KeyD") this.move.r=0;
    });

    // 🔫 TIRO
    document.addEventListener("click", ()=>{
      if(!document.pointerLockElement) return;

      let weapon = this.weapons[this.currentWeapon];

      // cadência
      if(Date.now() - this.lastShot < weapon.fireRate) return;
      this.lastShot = Date.now();

      // 🔊 som
      let s = document.getElementById("shootSound");
      if(s){
        s.currentTime = 0;
        s.play();
      }

      // 💥 recoil
      this.camera.rotation.x -= 0.05;

      // 💥 flash
      if(window.flash){
        window.flash.visible = true;
        setTimeout(()=>window.flash.visible = false, 50);
      }

      // 🎯 animação da mira
      const cross = document.getElementById("crosshair");
      cross.style.transform = "translate(-50%, -50%) scale(1.4)";

      setTimeout(()=>{
        cross.style.transform = "translate(-50%, -50%) scale(1)";
      },100);

      // 🌐 envia tiro pro servidor (multiplayer)
      this.socket.emit("shoot",{
        weapon: this.currentWeapon,
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      });

      // 🎯 RAYCAST LOCAL (bots)
      this.raycaster.setFromCamera(
        new THREE.Vector2(0,0),
        this.camera
      );

      const hits = this.raycaster.intersectObjects(
        window.scene.children,
        true
      );

      let hit = false;

      hits.forEach(h=>{
        if(h.object.userData.enemy){
          h.object.userData.enemy.takeDamage(
            this.weapons[this.currentWeapon].damage
          );
          hit = true;
        }
      });

      // 🎯 hitmarker
      if(hit){
        cross.style.color = "red";

        setTimeout(()=>{
          cross.style.color = "white";
        },100);
      }
    });

    // ❤️ receber dano do servidor
    this.socket.on("damage", data=>{
      if(data.id === this.socket.id){
        this.takeDamage(data.amount);
      }
    });
  }

  update(){
    let f = new THREE.Vector3();
    this.camera.getWorldDirection(f);
    f.y = 0;
    f.normalize();

    let r = new THREE.Vector3();
    r.crossVectors(f, new THREE.Vector3(0,1,0)).normalize();

    if(this.move.f) this.camera.position.add(f.clone().multiplyScalar(this.speed));
    if(this.move.b) this.camera.position.add(f.clone().multiplyScalar(-this.speed));
    if(this.move.l) this.camera.position.add(r.clone().multiplyScalar(-this.speed));
    if(this.move.r) this.camera.position.add(r.clone().multiplyScalar(this.speed));
  }

  // ❤️ dano
  takeDamage(d){
    this.health -= d;

    document.getElementById("health").innerText = "❤️ " + this.health;

    // 💥 feedback tela
    document.body.style.background = "#330000";

    setTimeout(()=>{
      document.body.style.background = "black";
    },100);

    if(this.health <= 0){
      alert("Você morreu!");
      location.reload();
    }
  }
}
