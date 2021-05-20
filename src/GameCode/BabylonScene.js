import React from "react";
import {StandardMaterial, HemisphericLight, Scene, Vector3, Mesh, Color3, Color4, ShadowGenerator, PointLight, FreeCamera, Matrix, MeshBuilder, Quaternion, GamepadManager} from "@babylonjs/core";import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import SceneComponent from "./SceneComponent"; // uses above component in same directory
import {Environment} from "./Enviorment";
import {Player} from "./Player"
import {PlayerInput} from "./PlayerInput"


const states = {
  MAIN_MENU: 0,
  CUTSCENE: 1,
  GAME: 2,
}

class BabylonScene {
  constructor(engine, scene) {
    this._scene = scene;
    this._engine = engine;
    this._canvas = scene.getEngine().getRenderingCanvas();
    this._gamepadManager = new GamepadManager();
    this._state = 0;
  }

  onRender = () => {

  }

  async main() {
    await this._goToMainMenu();

    // Register a render loop to repeatedly render the scene
    this._engine.runRenderLoop(() => {
        switch (this._state) {
            case states.MAIN_MENU:
                this._scene.render();
                break;
            case states.CUTSCENE:
                this._scene.render();
                break;
            case states.GAME:
                this._scene.render();
                break;
            default: break;
        }
    });

    //resize if the screen is resized/rotated
    window.addEventListener('resize', () => {
        this._engine.resize();
    });
  }

  async _goToMainMenu() {
    this._engine.displayLoadingUI();
    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());



    
    //create a fullscreen ui for all of our GUI elements
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

    //create a simple button
    const startBtn = Button.CreateSimpleButton("start", "PLAY");
    startBtn.width = 0.2;
    startBtn.height = "40px";
    startBtn.color = "white";
    startBtn.top = "-14px";
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    //this handles interactions with the start button attached to the scene
    startBtn.onPointerDownObservable.add(() => {
        this._goToCutScene();
        scene.detachControl(); //observables disabled
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    //lastly set the current state to the start state and set the scene to the start scene
    this._scene.dispose();
    this._scene = scene;
    this._state = states.MAIN_MENU;
  }

  async _goToCutScene() {

    this._engine.displayLoadingUI();
    //--SETUP SCENE--
    //dont detect any inputs from this ui while the game is loading
    this._scene.detachControl();
    this._cutScene = new Scene(this._engine);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this._cutScene);
    camera.setTarget(Vector3.Zero());
    this._cutScene.clearColor = new Color4(0, 0, 0, 1);

    await this._cutScene.whenReadyAsync();
    this._scene.dispose();
    this._state = states.CUTSCENE;
    this._scene = this._cutScene;

    var finishedLoading = false;
    var canplay = true;
    await this._setUpGame().then((res) => {
      finishedLoading = true;
    });

    if(finishedLoading && canplay) {
      canplay = false;
      this._goToGame();
    }
  }

  async _setUpGame() {

    //--CREATE SCENE--
    let scene = new Scene(this._engine);
    this._gamescene = scene;

    //--CREATE ENVIRONMENT--
    const environment = new Environment(scene);
    this._environment = environment; //class variable for App
    await this._environment.load(); //environment
    await this._loadCharacterAssets(scene); //character
  }


  async _goToGame(){
    //--SETUP SCENE--
    this._scene.detachControl();
    let scene = this._gamescene;

    this._input = new PlayerInput(scene, this._gamepadManager);

    //primitive character and setting
    await this._initializeGameAsync(scene);

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    scene.getMeshByName("outer").position = new Vector3(0, 0, 0);
    scene.getMeshByName("outer2").position = new Vector3(5, 0, 5);

    //get rid of start scene, switch to gamescene and change states
    this._scene.dispose();
    this._state = states.GAME;
    this._scene = scene;
    this._engine.hideLoadingUI();
    //the game is ready, attach control back
    this._scene.attachControl();
  }

  async _loadCharacterAssets(scene) {
    async function loadCharacterOne() {
      //collision mesh
      const outer = MeshBuilder.CreateBox("outer", { width: 2, depth: 1, height: 3 }, scene);
      outer.isVisible = false;
      outer.isPickable = false;
      outer.checkCollisions = true;

      //move origin of box collider to the bottom of the mesh (to match imported player mesh)
      outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
      //for collisions
      outer.ellipsoid = new Vector3(1, 1.5, 1);
      outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

      outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player

      var box = MeshBuilder.CreateBox("Small1", { width: 0.5, depth: 0.5, height: 0.25, faceColors: [new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1)] }, scene);
      box.position.y = 1.5;
      box.position.z = 1;

      var body = Mesh.CreateCylinder("body", 3, 2, 2, 0, 0, scene);
      var bodymtl = new StandardMaterial("red", scene);
      bodymtl.diffuseColor = new Color3(0.8, 0.5, 0.5);
      body.material = bodymtl;
      body.isPickable = false;
      body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0)); // simulates the imported mesh's origin

      //parent the meshes
      box.parent = body;
      body.parent = outer;

      return {
        mesh: outer
      }
    }

    async function loadCharacterTwo() {
            //collision mesh
            const outer = MeshBuilder.CreateBox("outer2", { width: 2, depth: 1, height: 3 }, scene);
            outer.isVisible = false;
            outer.isPickable = false;
            outer.checkCollisions = true;
      
            //move origin of box collider to the bottom of the mesh (to match imported player mesh)
            outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
            //for collisions
            outer.ellipsoid = new Vector3(1, 1.5, 1);
            outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
      
            outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player
      
            var box = MeshBuilder.CreateBox("Small2", { width: 0.5, depth: 0.5, height: 0.25, faceColors: [new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1), new Color4(0, 0, 0, 1)] }, scene);
            box.position.y = 1.5;
            box.position.z = 1;
      
            var body = Mesh.CreateCylinder("body2", 3, 2, 2, 0, 0, scene);
            var bodymtl = new StandardMaterial("red", scene);
            bodymtl.diffuseColor = new Color3(0.0, 0.0, 0.5);
            body.material = bodymtl;
            body.isPickable = false;
            body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0)); // simulates the imported mesh's origin
      
            //parent the meshes
            box.parent = body;
            body.parent = outer;
      
            return {
              mesh: outer
            }
    }

    async function loadCharacters() {
        const characterOneAssets = await loadCharacterOne();
        const characterTwoAssets = await loadCharacterTwo();
        return {
          characterOne: characterOneAssets,
          characterTwo: characterTwoAssets
        }
    }

    return loadCharacters().then(assets => {
      this.playerOneAssets = assets.characterOne;
      this.playerTwoAssets = assets.characterTwo;
    });

  }

  async _initializeGameAsync(scene) {
    //temporary light to light the entire scene
    var light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

    const light = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(0.08627450980392157, 0.10980392156862745, 0.15294117647058825);
    light.intensity = 35;
    light.radius = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.darkness = 0.4;

    //Create the player
    this._playerTwo = new Player(this.playerTwoAssets, scene, shadowGenerator);
    this._playerOne = new Player(this.playerOneAssets, scene, shadowGenerator, this._input); //dont have inputs yet so we dont need to pass it in
    const camera = this._playerOne.activatePlayerCamera();
  }
}


// let box;
// let box2;

// const onSceneReady = (scene) => {
//   createLevel(scene);
// };

// /**
//  * Will run on every frame render.  We are spinning the box on y-axis.
//  */
// const onRender = (scene) => {
//   let camera = scene.getCameraByID("UniCam"); 
//   var gamepadManager = new GamepadManager();
//   var deadzone = 0.1;
//   box.rotation = new Vector3(0,-Math.atan2(box.position.z - box2.position.z,box.position.x - box2.position.x),0);
//   let theta = box.rotation.y;  
//   gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
//     scene.registerBeforeRender(function () {
//       if(gamepad instanceof Xbox360Pad){
//           if (gamepad.buttonA) {
//             //Button has been pressed
//             console.log(theta * 180/Math.PI)
//         }
//           //Check if the x and y are in the deadzone
//           if (Math.sqrt(gamepad.leftStick.y* gamepad.leftStick.y + gamepad.leftStick.x * gamepad.leftStick.x) > deadzone) {
//             // box.position.z += Math.sin(-theta)*(gamepad.leftStick.y*0.0005)
//             // box.position.x += Math.cos(-theta)*(gamepad.leftStick.y*0.0005)
//             // box.position.z += Math.sin(theta)*(gamepad.leftStick.x*0.0005)
//             // box.position.x += Math.cos(-theta)*(gamepad.leftStick.x*0.0005)
//             box.moveWithCollisions(box.forward * (gamepad.leftStick.y*0.0000005));
//             // box.moveWithCollisions(box.left * (gamepad.leftStick.x*0.000005));
//           }
//       }
//     });
//   });
//   gamepadManager.onGamepadDisconnectedObservable.add((gamepad, state)=>{
//   });

//   followRotateCameraUpdate(box.position, box2.position, theta, camera, scene.getEngine().getDeltaTime());
  
// };



export default () => (
  <div>
    <SceneComponent antialias myScene={BabylonScene} id="my-canvas" />
  </div>
);