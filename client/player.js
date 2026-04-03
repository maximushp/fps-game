export class Player {
  constructor(camera, socket){
    this.camera = camera;
    this.socket = socket;

    this.camera.position.set(0,1.6,5);

    this.speed = 0.15;
    this.sensitivity = 0.002;

    this.move = {f:0,b:0,l:0,r:0};

    this.raycaster = new THREE.Raycaster();

    this.initControls();
  }

  initControls(){

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

    document.addEventListener("keydown", e=>{
      if(e.code==="KeyW") this.move.f=1;
      if(e.code==="KeyS") this.move.b=1;
      if(e.code==="KeyA") this.move.l=1;
      if(e.code==="KeyD") this.move.r=1;
    });

    document.addEventListener("keyup", e=>{
      if(e.code==="KeyW") this.move.f=0;
      if(e.code==="KeyS") this.move.b=0;
      if(e.code==="KeyA") this.move.l=0;
      if(e.code==="KeyD") this.move.r=0;
    });

    document.addEventListener("click", ()=>{
      if(!document.pointerLockElement) return;

      this.socket.emit("shoot",{});

      this.raycaster.setFromCamera(
        new THREE.Vector2(0,0),
        this.camera
      );

      const hits = this.raycaster.intersectObjects(window.scene.children,true);

      hits.forEach(hit=>{
        if(hit.object.userData.enemy){
          hit.object.userData.takeDamage(20);
        }
      });
    });
  }

  update(){
    let forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    let right = new THREE.Vector3();
    right.crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();

    if(this.move.f) this.camera.position.add(forward.clone().multiplyScalar(this.speed));
    if(this.move.b) this.camera.position.add(forward.clone().multiplyScalar(-this.speed));
    if(this.move.l) this.camera.position.add(right.clone().multiplyScalar(-this.speed));
    if(this.move.r) this.camera.position.add(right.clone().multiplyScalar(this.speed));
  }
}
