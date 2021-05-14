import {TransformNode, Vector3, ArcRotateCamera} from "@babylonjs/core" 
import {setupCamera, followRotateCameraUpdate} from "./CameraControls"
import compose from "lodash/fp/compose"
/**
 * This is where all of the playable characters will be handled
 * All of the players will be able to move and hit in similar ways
 * The light character has a dash that can quickly move him around, fast attack speed, kicks, low damage and hard bocks
 * The meduim character can 
 * The heavy character swings more slowly, but can block much easier and deals heavy damage and has longer attacks and disorientations
 */

const HEAVY_SPEED = 2;
const MEDUIM_SPEED = 5;
const LIGHT_SPEED = 10;


export class Player extends TransformNode {

    constructor(assets, scene, shadowGenerator, input) {
        super("player", scene);
        this.scene = scene;
        this._setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

        this._input = input; //inputs we will get
    }

    _setupPlayerCamera() {
        var camera4 = new ArcRotateCamera("arc", -Math.PI/2, Math.PI/2, 40, new Vector3(0,3,0), this.scene);
    }
}


const heavyPlayer = () => {

}

const meduimPlayer = () => {

}

export const lightPlayer = (assets, scene, shadowGenerator, input) => {
    // let state = {
    //     assets,
    //     scene,
    //     shadowGenerator,
    //     input,
    //     speed: LIGHT_SPEED,
    //     position: Vector3.Zero,
    // }
    // return TransformNode.assign(
    //     {},
    //     setupPlayerCamera(state)
    // )
}

const setupPlayerCamera = (state) => {
    var camera4 = new ArcRotateCamera("arc", -Math.PI/2, Math.PI/2, 40, new Vector3(0,3,0), state.scene);
}

const EatMixin = superclass => class extends superclass {
    eat(food) {
      console.log(`Eating ${food}`);
    }
};
  
const PoopMixin = superclass => class extends superclass {
    poop() {
      console.log("Going to 💩");
    }
};
  
const FlyMixin = superclass => class extends superclass {
    fly() {
      console.log("Flying for real!");
    }
};