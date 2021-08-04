import {TransformNode, Vector3, UniversalCamera, Ray} from "@babylonjs/core" 
// import compose from "lodash/fp/compose"
/**
 * This is where all of the playable characters will be handled
 * All of the players will be able to move and hit in similar ways
 * The light character has a dash that can quickly move him around, fast attack speed, kicks, low damage and hard bocks
 * The meduim character can 
 * The heavy character swings more slowly, but can block much easier and deals heavy damage and has longer attacks and disorientations
 */

// Player Speeds
const LIGHT_PLAYER_SPEED = 0.45;
const MEDIUM_PLAYER_SPEED = 0.45;
const HEAVY_PLAYER_SPEED = 0.30;

// Player Health
const LIGHT_PLAYER_HEALTH = 50;

const HEAVY_PLAYER_HEALTH = 100;

// Player Attack Parameters
const LIGHT_PLAYER_INIT_ATTACK_DAMAGE = 5;
const LIGHT_PLAYER_ATTACK_START_LAG = 0.1;
const LIGHT_PLAYER_ATTACK_RANGE = 5;
const LIGHT_PLAYER_ATTACK_DURATION = 1;
const LIGHT_PLAYER_ATTACK_END_LAG = 1;
const LIGHT_PLAYER_ATTACK_HIT_STUN = 0.2;


const HEAVY_PLAYER_INIT_ATTACK_DAMAGE = 10;
const HEAVY_PLAYER_ATTACK_START_LAG = 0.2;
const HEAVY_PLAYER_ATTACK_RANGE = 7;
const HEAVY_PLAYER_ATTACK_DURATION = 2;
const HEAVY_PLAYER_ATTACK_END_LAG = 2;
const HEAVY_PLAYER_ATTACK_HIT_STUN = 0.3;

// Player Special One Parameters
const LIGHT_PLAYER_DASH_FACTOR = 1.5;
const LIGHT_PLAYER_DASH_DURATION = 0.2;
const LIGHT_PLAYER_DASH_END_LAG = 0.3;


// Player Combo Extender Paramaters
const LIGHT_PLAYER_COMBO_EXTENDER_START_LAG = 0.1;
const LIGHT_PLAYER_COMBO_EXTENDER_END_LAG = 0.2;
const LIGHT_PLAYER_COMBO_EXTENDER_RANGE = 3;
const LIGHT_PLAYER_COMBO_EXTENDER_HITSTUN = 0.5;


const LIGHT_PLAYER_UNBLOCKABLE_START_LAG = 0.1;
const LIGHT_PLAYER_UNBLOCKABLE_END_LAG = 0.3;
const LIGHT_PLAYER_UNBLOCKABLE_DURATION = 0.1;
const LIGHT_PLAYER_UNBLOCKABLE_RANGE = 2;
const LIGHT_PLAYER_UNBLOCKABLE_HITSTUN = 1;
const LIGHT_PLAYER_UNBLOCKABLE_DAMAGE = 7;


const BLOCK_TIME = 0.1;
const BLOCKED_HITSTUN = 0.5;

class Player extends TransformNode {
    constructor(id, assets, scene, shadowGenerator, input, ui) {
        super("player", scene);
        this.id = id;
        this._hitStun = 0;
        this._lastGroundPos = Vector3.Zero();
        this.attackStarted = false;
        this.scene = scene;
        this._ui = ui;

        // this._idle = assets.animationGroups[0];
        // this._walk = assets.animationGroups[10];
        // this._swordPos = [assets.animationGroups[1], assets.animationGroups[2], assets.animationGroups[3], assets.animationGroups[4], assets.animationGroups[5], assets.animationGroups[6], assets.animationGroups[7], assets.animationGroups[8], assets.animationGroups[9]];
        // // this._scene.beginDirectAnimation(assets.mesh, [])

        
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;
        this.skeleton = assets.skeleton;


        // console.log(this.skeleton);
        // console.log(this.mesh);
        // console.log(assets.animationGroups);
        this.scene.getLightByName("sparklight").parent = this.scene.getTransformNodeByName("Empty");

        // this._setUpAnimations();
        this._input = input; //inputs we will get
    }

    _setupPlayerCamera() {
        this.camera = new UniversalCamera("UniCam", new Vector3(0,2,-10), this.scene);
        this.scene.activeCamera = this.camera;
        this.camera.inputs.clear();
    }
    
    activatePlayerCamera() {
        this.scene.registerBeforeRender(() => {
            this._beforeRenderUpdate();
            this._updatePlayerCamera();
        })
        return this.camera;
    }

    // _setUpAnimations() {

    //     this.scene.stopAllAnimations();
        // this._walk.loopAnimation = true;
        // this._idle.loopAnimation = true;
        //initialize current and previous
        // this._currentAnim = this._idle;
        // this._lastSwordPos = this._swordPos[8];
        // this._prevAnim = this._idle;
    //     this._idle.play(true);
    // }

    // _animatePlayer() {
        // if (this._input.conHorizontal != 0 || this._input.conVertical != 0) {
            
        //     this._currentAnim = this._walk;
        // } else {

        //     this._currentAnim = this._idle;
        // }

        // if(this._currentAnim != null && this._prevAnim !== this._currentAnim){
        //     this._prevAnim.stop();
        //     this._currentAnim.start(this._currentAnim.loopAnimation, 1.0, this._currentAnim.from, this._currentAnim.to, true);
        //     this._prevAnim = this._currentAnim;
        // }
        // if (this._swordPos[this._input.rightStickPos] != null && this._swordPos[this._input.rightStickPos] != this._lastSwordPos) {
        //     this._lastSwordPos.stop();
        //     this._swordPos[this._input.rightStickPos].start(true, 1.0, this._swordPos.from, this._swordPos.to, true);
        //     this._lastSwordPos = this._swordPos[this._input.rightStickPos];
        // }
    // }

    _beforeRenderUpdate() {
        
        if (this._input.takeHit) {
            this._takeHit(5, 5, 2);
        }

        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;
        // this._animatePlayer();
        if (this._hitStun > 0) {
            this._updateHitStun();
            this._updateLag();
            return;
        }
        if (!this._specialOneStarted) {
            this._updateRotation();
        }
        if (!this._specialOneStarted && !this._attackStarted) {
            this._updateFromControls();
        }

        if (this._unblockableStarted || this._input.unblockable) {
            this._preformUnblockable();
        }
        
        if (this._lag > 0) {
            this._updateLag();
            return;
        }

        if (this._specialOneStarted || this._input.specialOne) {
            this._preformSpecialOne();            
        }

        if (this._comboExtenderStarted || this._input.comboExt) {
            this._preformComboExtend();
        }

        if (this._input.attacking) {
            if (this._attackStarted) {
                this._attack();
            } else {
                this._attackStarted = true;
                this._attackTime = 0;
            }
        } 
        if (this._attackStarted && !this._input.attacking) {
            this._endAttack();
        }
        
    }

    _updateRotation() {
        let playerTwoPos = this._opponent.getPosition();
        this.mesh.rotation = new Vector3(0,-Math.atan2(this.mesh.position.z - playerTwoPos.z, this.mesh.position.x - playerTwoPos.x) - Math.PI / 2,0);
    }

    _updateLag() {
        this._lag -= this._deltaTime;
    }

    _updateHitStun() {
        this._hitStun -= this._deltaTime;
    }

    takeDamage(hitStun, damage) {
        // if (this._input.rightStickTheta == )
        this._playerHealth -= damage;
        this.applyHitStun(hitStun);
        this._ui.changeHealth(this.id, this._playerHealth);
        console.log(this.mesh.name + " got hit for " + damage + " damage");
    }

    applyHitStun(hitStun) {
        this._attackStarted = false;
        this._attackTime = 0;
        
        this._specialOneStarted = false;
        this._specialOneTime = 0;

        this._unblockableStarted = false;
        this._unblockableTime = 0;

        this._hitStun = hitStun;
    }

    setOpponent(opponent) {
        this._opponent = opponent;
    }

    getPlayerHealth() {
        return this._playerHealth;
    }

    getPosition() {
        return this.mesh.position;
    }

    getMesh() {
        return this.mesh;
    }

    checkInRange(range, target) {
        return this.mesh.position.subtract(target).length() < range;
    }

    _isSwordRight(swordPos) {
        if (this._input.rightStickPos == null) {
            return;
        }
        let blocked = false;
        switch (this._input.rightStickPos) {
            case 0:
                blocked = swordPos == 4;
                break;
            case 1:
                blocked = swordPos == 3;
                break;
            case 2:
                blocked = swordPos == 2;
                break;
            case 3:
                blocked = swordPos == 1;
                break;
            case 4:
                blocked = swordPos == 0;
                break;
            case 5:
                blocked = swordPos == 7;
                break;
            case 6:
                blocked = swordPos == 6;
                break;
            case 7:
                blocked = swordPos == 5;
                break;
            default:
                break;
        }
        return blocked;
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

const movementMixin = {
    _updateFromControls() {
        this._moveDirection = Vector3.Zero(); // vector that holds movement information
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
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * this._playerSpeed);

        this.mesh.moveWithCollisions(this._moveDirection);
    }
}

const cameraMixin = {
    _updatePlayerCamera() {
        var yOffset = 5;
        this.camera.position = this.mesh.position.add(this.mesh.right).add(this.mesh.forward.multiplyByFloats(-10, 1, -10));
        this.camera.position.y += yOffset;
        if (!this._specialOneStarted) {
            this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), this.scene.getMeshByID("outer2").position, 0.1));
        }
        
    }
}

const attackMixin = {
    _attack() {
        this._attackTime += this._deltaTime;
        if (this._attackTime > this._attackDuration) {
            this._endAttack();
            console.log('miss');
        }
        
        if (this._attackTime > this._attackStartLag) {
            
            console.log(this.mesh.position.subtract(this._opponent.getPosition()).length());
            if (this.checkInRange(this._attackRange, this._opponent.getPosition())) {
                this._endAttack();
                this._opponent._takeHit(this._attackStun, this._initAttackDamage, this._input.rightStickPos);
            }
            
        }
    },

    _endAttack() {
        this._attackStarted = false;
        this._attackTime = 0;
        this._lag = this._attackEndLag;
    }
};


class LightPlayer extends Player {
    constructor(id, assets, scene, shadowGenerator, input, ui) {
        super(id, assets, scene, shadowGenerator, input, ui);
        this._playerSpeed = LIGHT_PLAYER_SPEED;
        this._playerHealth = LIGHT_PLAYER_HEALTH;

        this._attackStartLag = LIGHT_PLAYER_ATTACK_START_LAG;
        this._attackRange = LIGHT_PLAYER_ATTACK_RANGE;
        this._attackDuration = LIGHT_PLAYER_ATTACK_DURATION;
        this._attackEndLag = LIGHT_PLAYER_ATTACK_END_LAG;
        this._attackStun = LIGHT_PLAYER_ATTACK_HIT_STUN;
        this._initAttackDamage = LIGHT_PLAYER_INIT_ATTACK_DAMAGE;

        this._dashFactor = LIGHT_PLAYER_DASH_FACTOR;
        this._dashTime = LIGHT_PLAYER_DASH_DURATION;
        this._dashEndLag = LIGHT_PLAYER_DASH_END_LAG;
        
        this._comboExtenderStartLag = LIGHT_PLAYER_COMBO_EXTENDER_START_LAG;
        this._comboExtenderEndLag = LIGHT_PLAYER_COMBO_EXTENDER_END_LAG;
        this._comboExtenderRange = LIGHT_PLAYER_COMBO_EXTENDER_RANGE;
        this._comboExtenderHitStun = LIGHT_PLAYER_COMBO_EXTENDER_HITSTUN;


        this._unblockableStartLag = LIGHT_PLAYER_UNBLOCKABLE_START_LAG;
        this._unblockableEndLag = LIGHT_PLAYER_UNBLOCKABLE_END_LAG;
        this._unblockableRange = LIGHT_PLAYER_UNBLOCKABLE_RANGE;
        this._unblockableHitStun = LIGHT_PLAYER_UNBLOCKABLE_HITSTUN;
        this._unblockableDamage = LIGHT_PLAYER_UNBLOCKABLE_DAMAGE;

        this._blockTime = BLOCK_TIME;
        this._blockedHitstun = BLOCKED_HITSTUN;
    }

    _takeHit(hitStun, damage, swordPos) {
        let blocked = false;
        if (this._attackTime < this._blockTime) {
            blocked = this._isSwordRight(swordPos);
        }

        if (blocked) {
            this._opponent.applyHitStun(this._blockedHitstun);
        } else {
            this.takeDamage(hitStun, damage);
        }
    }
}

const dashMixin = {
    _preformSpecialOne() {
        if (!this._specialOneStarted) {
            this._specialOneStarted = true;
            this._specialOneTime = this._dashTime;
        }
        // var playerTwoPos = this.scene.getMeshByID("outer2").position;
        // this.mesh.rotation = new Vector3(0,-Math.atan2(this.mesh.position.z - playerTwoPos.z, this.mesh.position.x - playerTwoPos.x) - Math.PI / 2,0);

        this._moveDirection.normalize();
        this.mesh.moveWithCollisions(this._moveDirection.multiplyByFloats(this._dashFactor, 1, this._dashFactor));
        this._specialOneTime -= this._deltaTime;
        if (this._specialOneTime < 0) {
            this._lag = this._dashEndLag;
            this._specialOneStarted = false;
            this._specialOneTime = 0;
        }
    }
}

const kickMixin = {
    _preformComboExtend() {
        if (!this._comboExtenderStarted) {
            this._comboExtenderStarted = true;
            this._comboExtenderTime = 0;
        }
        this._comboExtenderTime += this._deltaTime;
        if (this._comboExtenderTime >= this._comboExtenderStartLag) {
            if (!this.checkInRange(this._comboExtenderRange, this._opponent.getPosition())) {
                this._comboExtenderStarted = false;
                this._lag = this._comboExtenderEndLag;
                return;  
            }
            let rightStickAngle = -Math.atan2(this._input.rightValues.y, this._input.rightValues.x);
            let direction = Vector3.Zero();
            if (rightStickAngle > -Math.PI/2 && rightStickAngle < Math.PI/4) {
                direction = this.mesh.right;
            } else if (rightStickAngle > Math.PI/4 && rightStickAngle < Math.PI*3/4) {
                direction = this.mesh.forward;
            } else {
                direction = this.mesh.right.multiplyByFloats(-1,1,-1);
            }
            this._opponent.getMesh().moveWithCollisions(direction.multiplyByFloats(10,10,10));
            this._comboExtenderStarted = false;
            this._lag = this._comboExtenderEndLag;
            this._opponent.applyHitStun(this._comboExtenderHitStun);
        }

    }
}

const stabMixin = {
    _preformUnblockable() {
        if (!this._unblockableStarted) {
            this._unblockableStarted = true;
            this._unblockableTime = 0;
        }
        this._unblockableTime += this._deltaTime;
        if (this._unblockableTime >= this._unblockableStartLag) {
            if (this.checkInRange(this._unblockableRange, this._opponent.getPosition())) {
                this._unblockableStarted = false;
                this._unblockableTime = 0;
                this._lag = this._unblockableEndLag;
                this._opponent._takeHit(this._unblockableStun, this._unblockableDamage, 0);
                return;
            }
            if (this._input.cancel) {
                this._unblockableStarted = false;
                this._unblockableTime = 0;
                this._lag = this._unblockableEndLag / 2;
            }
            this.mesh.moveWithCollisions(this.mesh.forward);
        }
    }
}



Object.assign(LightPlayer.prototype, movementMixin, cameraMixin, attackMixin, dashMixin, kickMixin, stabMixin);




class HeavyPlayer extends Player {
    constructor(id, assets, scene, shadowGenerator, input, ui) {
        super(id, assets, scene, shadowGenerator, input, ui);
        this._playerSpeed = HEAVY_PLAYER_SPEED;
        this._playerHealth = HEAVY_PLAYER_HEALTH;

        this._attackStartLag = HEAVY_PLAYER_ATTACK_START_LAG;
        this._attackRange = HEAVY_PLAYER_ATTACK_RANGE;
        this._attackDuration = HEAVY_PLAYER_ATTACK_DURATION;
        this._attackEndLag = HEAVY_PLAYER_ATTACK_END_LAG;
        this._attackStun = HEAVY_PLAYER_ATTACK_HIT_STUN;
        this._initAttackDamage = HEAVY_PLAYER_INIT_ATTACK_DAMAGE;
    }

    _takeHit(hitStun, damage, swordPos) {
        let blocked = false;
        blocked = this._isSwordRight(swordPos);

        if (blocked) {
            this._opponent.applyHitStun(this._blockedHitstun);
        } else {
            this.takeDamage(hitStun, damage);
        }
    }
}








Object.assign(HeavyPlayer.prototype, movementMixin, cameraMixin, attackMixin);


const meduimPlayer = () => {

}

export {LightPlayer, HeavyPlayer};