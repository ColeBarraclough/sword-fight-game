import React from "react";
import { UniversalCamera, Vector3, HemisphericLight, MeshBuilder, GamepadManager, Xbox360Pad} from "@babylonjs/core";
import { followRotateCameraUpdate} from "./CameraControls"
import SceneComponent from "./SceneComponent"; // uses above component in same directory
// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
// import "./App.css";

let box;
let box2;

const createLevel = (scene) => {

  const canvas = scene.getEngine().getRenderingCanvas();



  // Our built-in 'box' shape.
  box = MeshBuilder.CreateBox("box", { size: 1 }, scene);

  box2 = MeshBuilder.CreateBox("box2", { size: 2 }, scene);

  box2.position.y = 1;
  box2.position.z = 1;
  var camera = new UniversalCamera("UniCam", new Vector3(0,2,-10), scene);
  camera.attachControl(canvas, true);
  camera.inputs.clear();

  // Move the box upward 1/2 its height
  box.position.y = 1;

  // Our built-in 'ground' shape.



  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;
}

const onSceneReady = (scene) => {
  createLevel(scene);
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene) => {
  let camera = scene.getCameraByID("UniCam"); 
  var gamepadManager = new GamepadManager();
  var deadzone = 0.1;
  box.rotation = new Vector3(0,-Math.atan2(box.position.z - box2.position.z,box.position.x - box2.position.x),0);
  let theta = box.rotation.y;  
  gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
    scene.registerBeforeRender(function () {
      if(gamepad instanceof Xbox360Pad){
          console.log(gamepad.leftStick.x +  ", " +  gamepad.leftStick.y)
          if(gamepad.buttonA){

          }
          //Check if the x and y are in the deadzone
          if (Math.sqrt(gamepad.leftStick.y* gamepad.leftStick.y + gamepad.leftStick.x * gamepad.leftStick.x) > deadzone) {
            box.position.z -= Math.sin(theta)*(gamepad.leftStick.y*0.0005) + Math.cos(theta)*gamepad.leftStick.x*0.0005
            box.position.x += Math.cos(theta)*(gamepad.leftStick.y*0.0005) + Math.sin(theta)*gamepad.leftStick.x*0.0005;
          }
      }
    });
  });
  gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
  });

  
  followRotateCameraUpdate(box.position, box2.position, theta, camera);
  
};

export default () => (
  <div>
    <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
  </div>
);