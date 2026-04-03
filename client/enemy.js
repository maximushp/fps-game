export class Enemy {
  constructor(scene){
    this.scene=scene;

    this.mesh=new THREE.Mesh(
      new THREE.BoxGeometry(1,2,1),
      new THREE.MeshStandardMaterial({color:0xff0000})
    );

    this.respawn();

    this.health=100;
    this.speed=0.04;
    this.lastShot=0;
    this.fireRate=800;

    this.mesh.userData.enemy=this;

    scene.add(this.mesh);
  }

  update(player){
    if(!player.isPlaying) return;

    let dir=new THREE.Vector3().subVectors(player.camera.position,this.mesh.position);
    let dist=dir.length();
    dir.normalize();

    if(dist>2){
      this.mesh.position.add(dir.multiplyScalar(this.speed));
    }

    if(dist<8 && Date.now()-this.lastShot>this.fireRate){
      this.lastShot=Date.now();
      player.takeDamage(10);
    }
  }

  takeDamage(d){
    this.health-=d;

    if(this.health<=0){
      this.respawn();
    }
  }

  respawn(){
    this.mesh.position.set(Math.random()*40-20,1,Math.random()*40-20);
    this.health=100;
  }
}
