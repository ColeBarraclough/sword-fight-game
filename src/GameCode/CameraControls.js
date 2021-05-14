import { Vector3, UniversalCamera } from "@babylonjs/core";

const setupCamera = (scene, canvas) => {
    let camera = new UniversalCamera("UniCam", new Vector3(0,2,-10), scene);
    camera.attachControl(canvas, true);
    camera.inputs.clear();
    return camera;
}

const followRotateCameraUpdate = (player1Pos, player2Pos, theta, camera, deltaTime) => {
    let xOffset = 1;
    let yOffset = 1;
    let zOffset = 5;
    let newX = player1Pos.x + Math.cos(-theta)*zOffset + Math.sin(theta)*xOffset;
    let newY = player1Pos.y + yOffset;
    let newZ = player1Pos.z + Math.sin(-theta)*zOffset + Math.cos(theta)*xOffset;
    camera.position = new Vector3(newX, newY, newZ)
    camera.setTarget(player2Pos);
}

export {setupCamera, followRotateCameraUpdate};