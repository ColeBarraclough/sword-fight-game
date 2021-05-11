var followRotateCameraUpdate = (player1Pos, player2Pos, theta, camera) => {
    let xOffset = 1;
    let yOffset = 1;
    let zOffset = 5;
    camera.position.x = player1Pos.x + Math.cos(theta)*zOffset - Math.sin(theta)*xOffset;
    camera.position.y = player1Pos.y + yOffset;
    camera.position.z = player1Pos.z - Math.sin(theta)*zOffset + Math.cos(theta)*xOffset;
    camera.setTarget(player2Pos);
}

export {followRotateCameraUpdate};