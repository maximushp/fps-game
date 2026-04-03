export class Enemy {
  constructor(scene){
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1,2,1),
      new THREE.MeshStandardMaterial({color:0xff0000})
    );

    this.mesh.position.set(
      Math.random()*20-10,
      1,
      Math.random()*20-10
    );

    this.speed = 0.03;
    this.health = 100;

    this.mesh.userData.enemy = true;
    this.mesh.userData.takeDamage = (d)=>this.takeDamage(d);

    scene.add(this.mesh);
  }

  update(player){
    if(this.health<=0){
      this.mesh.visible = false;
      return;
    }

    let dir = new THREE.Vector3()
      .subVectors(player.camera.position, this.mesh.position)
      .normalize();

    this.mesh.position.add(dir.multiplyScalar(this.speed));
  }

  takeDamage(d){
    this.health -= d;

    if(this.health<=0){
      this.mesh.visible = false;
    }
  }
}
