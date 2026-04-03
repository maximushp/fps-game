export class Player {
  constructor(camera, socket) {
    this.camera = camera;
    this.socket = socket;

    this.camera.position.set(0, 1.6, 5);

    this.move = {
      forward: false,
      back: false,
      left: false,
      right: false
    };

    this.speed = 0.1;

    this.initControls();
  }

  initControls() {
    // 🎯 MOUSE LOOK
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement) {
        this.camera.rotation.y -= e.movementX * 0.002;
        this.camera.rotation.x -= e.movementY * 0.002;

        // limitar olhar vertical
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
    const direction = new THREE.Vector3();

    if (this.move.forward) direction.z -= 1;
    if (this.move.back) direction.z += 1;
    if (this.move.left) direction.x -= 1;
    if (this.move.right) direction.x += 1;

    direction.normalize();

    const angle = this.camera.rotation.y;

    this.camera.position.x +=
      (direction.x * Math.cos(angle) -
        direction.z * Math.sin(angle)) *
      this.speed;

    this.camera.position.z +=
      (direction.z * Math.cos(angle) +
        direction.x * Math.sin(angle)) *
      this.speed;
  }
}
