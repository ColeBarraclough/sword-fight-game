import React from "react";
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, GamepadManager, Xbox360Pad } from "@babylonjs/core";
import SceneComponent from "./SceneComponent"; // uses above component in same directory
// import SceneComponent from 'babylonjs-hook'; // if you install 'babylonjs-hook' NPM.
// import "./App.css";

let box;

const onSceneReady = (scene) => {
  // This creates and positions a free camera (non-mesh)
  var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Our built-in 'box' shape.
  box = MeshBuilder.CreateBox("box", { size: 2 }, scene);

  // Move the box upward 1/2 its height
  box.position.y = 1;

  // Our built-in 'ground' shape.
  MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene) => {
  var gamepadManager = new GamepadManager();
  gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
    scene.registerBeforeRender(function () {
      if(gamepad instanceof Xbox360Pad){
          if(gamepad.buttonA){
              box.position.y += 0.0005;
          }
          box.position.z -= gamepad.leftStick.y*0.0005;
          box.position.x += gamepad.leftStick.x*0.0005;
      }
    });
  });
  gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
  });
};

export default () => (
  <div>
    <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
  </div>
);