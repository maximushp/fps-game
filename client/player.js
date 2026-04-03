export class Player {
  constructor(camera, socket) {
    this.camera = camera;
    this.socket = socket;

    this.camera.position.set(0, 1.6, 5);

    this.speed = 0.15;

    // 🎯 sensibilidade estilo CS
    this.sensitivity = 0.002;

    this.move = {
      forward: false,
      back: false,
      left: false,
      right: false
    };

    this.initControls();
  }

  initControls() {

    // 🎯 MOUSE (PADRÃO CS)
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement) {

        // horizontal (igual CS)
        this.camera.rotation.y -= e.movementX * this.sensitivity;

        // vertical (igual CS - sem inversão bugada)
        this.camera.rotation.x -= e.movementY * this.sensitivity;

        // limitar ângulo vertical (não virar o pescoço kkk)
        this.camera.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.camera.rotation.x)
        );
      }
    });

    // ⌨️ MOVIMENTO
    document.addEventListener("keydown", (e) => {
      if (e.code === "KeyW") this.move.forward = true;
      if (e.code === "KeyS") this.move.back = true;
      if (e.code === "KeyA") this.move.left = true;
      if (e.code === "KeyD") this.move.right = true;
    });

    document.addEventListener("keyup", (e) => {
      if (e.code === "KeyW") this.move.forward = false;
      if (e.code === "KeyS") this.move.back = false;
      if (e.code === "KeyA") this.move.left = false;
      if (e.code === "KeyD") this.move.right = false;
    });

    // 🔫 TIRO
    document.addEventListener("click", () => {
      if (document.pointerLockElement) {
        this.socket.emit("shoot", {});
      }
    });
  }

  update() {
    const speed = this.speed;

    // direção frontal baseada na câmera
    let forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // direção lateral
    let right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // movimentação estilo FPS real
    if (this.move.forward) {
      this.camera.position.add(forward.clone().multiplyScalar(speed));
    }

    if (this.move.back) {
      this.camera.position.add(forward.clone().multiplyScalar(-speed));
    }

    if (this.move.left) {
      this.camera.position.add(right.clone().multiplyScalar(-speed));
    }

    if (this.move.right) {
      this.camera.position.add(right.clone().multiplyScalar(speed));
    }
  }
}
