export class Player {
  constructor(camera,socket){
    this.camera=camera;
    this.socket=socket;

    this.camera.position.set(0,1.6,5);

    this.health=100;
    this.isPlaying=false;

    this.speed=0.15;
    this.sensitivity=0.002;

    this.move={f:0,b:0,l:0,r:0};

    this.weapons={
      pistol:{damage:20, fireRate:400},
      rifle:{damage:10, fireRate:100}
    };

    this.currentWeapon="pistol";
    this.lastShot=0;

    this.raycaster=new THREE.Raycaster();

    this.init();
  }

  init(){
    document.addEventListener("mousemove",e=>{
      if(document.pointerLockElement){
        this.camera.rotation.y -= e.movementX*this.sensitivity;
        this.camera.rotation.x -= e.movementY*this.sensitivity;

        this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2,this.camera.rotation.x));
      }
    });

    document.addEventListener("keydown",e=>{
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

    document.addEventListener("keyup",e=>{
      if(e.code==="KeyW") this.move.f=0;
      if(e.code==="KeyS") this.move.b=0;
      if(e.code==="KeyA") this.move.l=0;
      if(e.code==="KeyD") this.move.r=0;
    });

    document.addEventListener("click",()=>{
      if(!document.pointerLockElement) return;
      if(!this.isPlaying) return;

      let w=this.weapons[this.currentWeapon];

      if(Date.now()-this.lastShot<w.fireRate) return;
      this.lastShot=Date.now();

      let s=document.getElementById("shootSound");
      if(s){ s.currentTime=0; s.play(); }

      this.camera.rotation.x -= 0.05;

      window.flash.visible=true;
      setTimeout(()=>window.flash.visible=false,50);

      this.socket.emit("shoot",{
        weapon:this.currentWeapon,
        x:this.camera.position.x,
        y:this.camera.position.y,
        z:this.camera.position.z
      });

      this.raycaster.setFromCamera(new THREE.Vector2(0,0), this.camera);

      let hits=this.raycaster.intersectObjects(window.scene.children,true);

      hits.forEach(h=>{
        if(h.object.userData.enemy){
          h.object.userData.enemy.takeDamage(w.damage);
        }
      });
    });

    this.socket.on("damage",data=>{
      if(data.id===this.socket.id){
        this.takeDamage(data.amount);
      }
    });
  }

  update(){
    if(!this.isPlaying) return;

    let f=new THREE.Vector3();
    this.camera.getWorldDirection(f);
    f.y=0; f.normalize();

    let r=new THREE.Vector3();
    r.crossVectors(f,new THREE.Vector3(0,1,0)).normalize();

    if(this.move.f) this.camera.position.add(f.clone().multiplyScalar(this.speed));
    if(this.move.b) this.camera.position.add(f.clone().multiplyScalar(-this.speed));
    if(this.move.l) this.camera.position.add(r.clone().multiplyScalar(-this.speed));
    if(this.move.r) this.camera.position.add(r.clone().multiplyScalar(this.speed));
  }

  takeDamage(d){
    if(!this.isPlaying) return;

    this.health -= d;
    document.getElementById("health").innerText="❤️ "+this.health;

    if(this.health<=0){
      this.health=100;
      this.camera.position.set(Math.random()*10,1.6,Math.random()*10);
    }
  }
}
