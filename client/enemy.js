export class Enemy {
  constructor(scene){
    this.scene = scene;

    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1,2,1),
      new THREE.MeshStandardMaterial({color:0xff0000})
    );

    this.mesh.position.set(
      Math.random()*20-10,
      1,
      Math.random()*20-10
    );

    this.health = 100;
    this.speed = 0.04;

    this.lastShot = 0;
    this.fireRate = 800;

    // 🔗 referência pra detectar hit
    this.mesh.userData.enemy = this;

    scene.add(this.mesh);
  }

  update(player){
    if(this.health <= 0){
      this.respawn();
      return;
    }

    // 🎯 seguir player
    let dir = new THREE.Vector3()
      .subVectors(player.camera.position, this.mesh.position);

    let distance = dir.length();

    dir.normalize();

    // movimentação
    if(distance > 2){
      this.mesh.position.add(dir.multiplyScalar(this.speed));
    }

    // 🔫 atacar player
    if(distance < 8 && Date.now() - this.lastShot > this.fireRate){
      this.lastShot = Date.now();

      player.takeDamage(10);

      // 💥 feedback visual (flash no inimigo)
      this.mesh.material.color.set(0xffffff);

      setTimeout(()=>{
        this.mesh.material.color.set(0xff0000);
      },100);
    }
  }

  takeDamage(dmg){
    this.health -= dmg;

    // 💥 feedback visual ao tomar tiro
    this.mesh.material.color.set(0xffff00);

    setTimeout(()=>{
      this.mesh.material.color.set(0xff0000);
    },100);

    if(this.health <= 0){
      this.mesh.visible = false;
    }
  }

  respawn(){
    this.health = 100;

    this.mesh.position.set(
      Math.random()*20-10,
      1,
      Math.random()*20-10
    );

    this.mesh.visible = true;
  }
}
