export class Enemy {
  constructor(scene){
    this.scene = scene;

    // ================= CORPO HUMANO =================
    this.mesh = new THREE.Group();

    // corpo
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.5, 1.2, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5555ff })
    );
    body.position.y = 1;

    // cabeça
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35),
      new THREE.MeshStandardMaterial({ color: 0xffcc99 })
    );
    head.position.y = 2.1;

    // braços
    const armL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1),
      new THREE.MeshStandardMaterial({ color: 0xffcc99 })
    );
    armL.position.set(-0.6, 1.2, 0);
    armL.rotation.z = Math.PI / 2;

    const armR = armL.clone();
    armR.position.x = 0.6;

    // pernas
    const legL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    legL.position.set(-0.25, 0.3, 0);

    const legR = legL.clone();
    legR.position.x = 0.25;

    // montar
    this.mesh.add(body, head, armL, armR, legL, legR);

    this.respawn();

    this.health = 100;
    this.speed = 0.04;
    this.lastShot = 0;
    this.fireRate = 800;

    this.mesh.userData.enemy = this;

    scene.add(this.mesh);
  }

  update(player){
    if(!player.isPlaying) return;

    let dir = new THREE.Vector3()
      .subVectors(player.camera.position, this.mesh.position);

    let dist = dir.length();
    dir.normalize();

    // olhar para player
    this.mesh.lookAt(player.camera.position.x, this.mesh.position.y, player.camera.position.z);

    // andar
    if(dist > 2){
      this.mesh.position.add(dir.multiplyScalar(this.speed));
    }

    // atacar
    if(dist < 8 && Date.now() - this.lastShot > this.fireRate){
      this.lastShot = Date.now();
      player.takeDamage(10);
    }
  }

  takeDamage(d){
    this.health -= d;

    // efeito visual ao tomar dano
    this.mesh.children.forEach(part=>{
      if(part.material){
        part.material.color.set(0xff0000);
      }
    });

    setTimeout(()=>{
      this.mesh.children.forEach(part=>{
        if(part.material){
          part.material.color.setHex(
            part === this.mesh.children[1] ? 0xffcc99 : 0x5555ff
          );
        }
      });
    },100);

    if(this.health <= 0){
      this.respawn();
    }
  }

  respawn(){
    this.mesh.position.set(
      Math.random()*200 - 100,
      0,
      Math.random()*200 - 100
    );

    this.health = 100;
  }
}
