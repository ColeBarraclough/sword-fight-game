import {TransformNode, Vector3, UniversalCamera} from "@babylonjs/core" 
// import compose from "lodash/fp/compose"
/**
 * This is where all of the playable characters will be handled
 * All of the players will be able to move and hit in similar ways
 * The light character has a dash that can quickly move him around, fast attack speed, kicks, low damage and hard bocks
 * The meduim character can 
 * The heavy character swings more slowly, but can block much easier and deals heavy damage and has longer attacks and disorientations
 */



export class Player extends TransformNode {
    static PLAYER_SPEED = 0.45;
    static JUMP_FORCE = 0.80;
    static GRAVITY = -2.8;

    constructor(assets, scene, shadowGenerator, input) {
        super("player", scene);
        this._lastGroundPos = Vector3.Zero();
        this.scene = scene;
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

        this._input = input; //inputs we will get
    }

    _setupPlayerCamera() {
        this.camera = new UniversalCamera("UniCam", new Vector3(0,2,-10), this.scene);
        this.scene.activeCamera = this.camera;
        this.camera.inputs.clear();
    }
    
    _updatePlayerCamera() {
        var theta = this.mesh.rotation.y;
        var xOffset = 3;
        var yOffset = 5;
        var zOffset = 5;
        // var newX = this.mesh.position.x - Math.cos(theta)*zOffset - Math.sin(-theta)*xOffset;
        // var newY = this.mesh.position.y + yOffset;
        // var newZ = this.mesh.position.z - Math.sin(-theta)*zOffset - Math.cos(theta)*xOffset;


        this.camera.position = this.mesh.position.add(this.mesh.right).add(this.mesh.forward.multiplyByFloats(-10, 1, -10));
        this.camera.position.y += yOffset;
        this.camera.setTarget(this.scene.getMeshByID("outer2").position);
    }
    
    activatePlayerCamera() {
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updatePlayerCamera();
        })
        return this.camera;
    }

    _beforeRenderUpdate() {
        this._updateFromControls();
    }

    _updateFromControls() {
        var playerTwoPos = this.scene.getMeshByID("outer2").position;
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        this._moveDirection = Vector3.Zero(); // vector that holds movement information
        this.mesh.rotation = new Vector3(0,-Math.atan2(this.mesh.position.z - playerTwoPos.z, this.mesh.position.x - playerTwoPos.x) - Math.PI / 2,0);
        this._h = this._input.horizontal + this._input.conHorizontal; //x-axis
        this._v = this._input.vertical + this._input.conVertical; //z-axis

        let fwd = this.mesh.forward;
        let right = this.mesh.right;
        let correctedVertical = fwd.scaleInPlace(this._v);
        let correctedHorizontal = right.scaleInPlace(this._h);

        //movement based off of camera's view
        let move = correctedHorizontal.addInPlace(correctedVertical);

        this._moveDirection = new Vector3((move).normalize().x, 0, (move).normalize().z);


        //clamp the input value so that diagonal movement isn't twice as fast
        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        if (inputMag < 0) {
            this._inputAmt = 0;
        } else if (inputMag > 1) {
            this._inputAmt = 1;
        } else {
            this._inputAmt = inputMag;
        }

        //final movement that takes into consideration the inputs
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED);

        this.mesh.moveWithCollisions(this._moveDirection);
    
    }


    // _floorRaycast(offsetx, offsetz, raycastlen) {
    //     //position the raycast from bottom center of mesh
    //     let raycastFloorPos = new Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
    //     let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    //     //defined which type of meshes should be pickable
    //     let predicate = function (mesh) {
    //         return mesh.isPickable && mesh.isEnabled();
    //     }

    //     let pick = this.scene.pickWithRay(ray, predicate);

    //     if (pick.hit) { //grounded
    //         return pick.pickedPoint;
    //     } else { //not grounded
    //         return Vector3.Zero();
    //     }
    // }

    // _isGrounded() {
    //     if (this._floorRaycast(0, 0, .6).equals(Vector3.Zero())) {
    //         return false;
    //     } else {
    //         return true;
    //     }
    // }

    // _updateGroundDetection() {
    //     if (!this._isGrounded()) {
    //         this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
    //         this._grounded = false;
    //     }

    //     //limit the speed of gravity to the negative of the jump power
    //     if (this._gravity.y < -Player.JUMP_FORCE) {
    //         this._gravity.y = -Player.JUMP_FORCE;
    //     }
    //     this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

    //     if (this._isGrounded()) {
    //         this._gravity.y = 0;
    //         this._grounded = true;
    //         this._lastGroundPos.copyFrom(this.mesh.position);
    //     }
    // }
}


const heavyPlayer = () => {

}

const meduimPlayer = () => {

}

const moveMixin = superclass => class extends superclass {
    move(state) {

    }
}