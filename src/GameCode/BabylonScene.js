import "@babylonjs/loaders/glTF";

import React from "react";
import {SceneLoader, StandardMaterial, HemisphericLight, Scene, Vector3, Mesh, Color3, Color4, ShadowGenerator, PointLight, FreeCamera, Matrix, MeshBuilder, Quaternion, GamepadManager} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, InputText, ScrollViewer, StackPanel, TextBlock, RadioButton} from "@babylonjs/gui";
import {Hud} from "./ui.js"
import SceneComponent from "./SceneComponent"; // uses above component in same directory
import {Environment} from "./Enviorment";
import {LightPlayer, HeavyPlayer} from "./Player"
import {PlayerInput} from "./PlayerInput"
import io from "socket.io-client"
import { Room } from "./Room.js";

const states = {
  MAIN_MENU: 0,
  CUTSCENE: 1,
  GAME: 2,
  ROOM: 3,
}

class BabylonScene {
  constructor(engine, scene) {
    this._scene = scene;
    this._engine = engine;
    this._canvas = scene.getEngine().getRenderingCanvas();
    this._gamepadManager = new GamepadManager();
    this._state = 0;
    this._userName = "5up3rc001dud3";
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
            case states.ROOM:
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
    this._guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    this._guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

    const usernameInput = new InputText();
    usernameInput.width = 0.2;
    usernameInput.maxWidth = 0.2;
    usernameInput.height = "40px";
    usernameInput.placeholderText = "Enter a Username";
    usernameInput.placeholderColor = "grey";
    usernameInput.color = "black";
    usernameInput.background = "white";
    this._guiMenu.addControl(usernameInput);
    usernameInput.onBlurObservable.add(() => {
      this._userName = usernameInput.text;
    });


    //create a simple button
    const createRoomBtn = Button.CreateSimpleButton("createRoom", "Create a Room");
    createRoomBtn.width = 1;
    createRoomBtn.height = "100px";
    createRoomBtn.color = "white";
    createRoomBtn.thickness = 0;
    createRoomBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this._guiMenu.addControl(createRoomBtn);

    const joinRoomBtn = Button.CreateSimpleButton("joinRoom", "Join a Room");
    joinRoomBtn.width = 1;
    joinRoomBtn.height = "100px";
    joinRoomBtn.color = "white";
    joinRoomBtn.thickness = 0;
    joinRoomBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this._guiMenu.addControl(joinRoomBtn);

    //this handles interactions with the start button attached to the scene
    createRoomBtn.onPointerDownObservable.add(() => {
      if (this._socket == null) {
        this._setupSocket();
      } 
      this._guiMenu.removeControl(createRoomBtn);
      this._guiMenu.removeControl(joinRoomBtn);
      this._guiMenu.removeControl(usernameInput);
      this._roomId = makeid(10);
      this._socket.emit("create", {id: this._roomId, name: `${this._userName}'s Room`, username: this._userName});
      this._goToRoom(true, null);
    });

    joinRoomBtn.onPointerDownObservable.add(() => {
      this._guiMenu.removeControl(createRoomBtn);
      this._guiMenu.removeControl(joinRoomBtn);
      this._guiMenu.removeControl(usernameInput);
      this._stack = this._createRoomList();
      if (this._socket == null) {
        this._setupSocket();
      }
      this._socket.emit('room_request', "");
      // this._createCharacter = HeavyPlayer;
      // this._goToCutScene();
      // scene.detachControl(); //observables disabled
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    //lastly set the current state to the start state and set the scene to the start scene
    this._scene.dispose();
    this._scene = scene;
    this._state = states.MAIN_MENU;
  }

  _refreshRoomList() {
    this._stack.clearControls();
    let i = 0;
    this._rooms.forEach(element => {
      const roomBtn = new Button.CreateSimpleButton(element.roomId, element.roomName);
      roomBtn.width = 1;
      roomBtn.height = "100px";
      roomBtn.color = "white";
      roomBtn.thickness = 0;
      roomBtn.fontSize = "50";
      if (i % 2 == 0) {
        roomBtn.background = "orange";
      } else {
        roomBtn.background = "blue";
      }
      this._stack.addControl(roomBtn);
      roomBtn.onPointerDownObservable.add(() => {
        this._socket.emit("join", {roomId: element.roomId, username: this._userName});
      });
      i++;
    });
  }

  _createRoomList() {
    const roomsText = new TextBlock();
    roomsText.height = "100px";
    roomsText.width = 1;
    roomsText.text = "Choose a Room";
    roomsText.color = "white";
    roomsText.fontSize = 24;
    roomsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this._guiMenu.addControl(roomsText);
    
    const refreshBtn = Button.CreateImageOnlyButton("refresh", "images/refresh.png");
    refreshBtn.height = "70px";
    refreshBtn.width = "70px";
    refreshBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    refreshBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    refreshBtn.paddingRight = "5px";
    refreshBtn.paddingTop = "5px";
    this._guiMenu.addControl(refreshBtn);
    refreshBtn.onPointerDownObservable.add(() => {
      this._socket.emit('room_request', "");
    });

    const myScrollViewer = new ScrollViewer();
    myScrollViewer.height = "90%";
    myScrollViewer.width = "100%";
    myScrollViewer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

    const stack = new StackPanel();
    stack.width = "1000px";
    stack.height = "1000px";
    myScrollViewer.addControl(stack);
    this._guiMenu.addControl(myScrollViewer);
    return stack;
  }

  _setupSocket() {
    this._socket = io("ws://localhost:5000");
    this._socket.on("connect", () => {
      // either with send()
      this._socket.on("room_request", (a) => {
        this._rooms = a;
        console.log(this._rooms);
        this._refreshRoomList(this._stack);
      });

      this._socket.on("room", (roomData) => {
        this._goToRoom(false, roomData);
      });

      this._socket.on("hello", (info) => {
        console.log(info.userId);
      })

    });
    this._socket.emit("user_info", {username: this._userName});
    window.onbeforeunload = this._removeSocket();
  }

  _removeSocket() {
    this._socket.emit("user_leave");
  }

  async _goToRoom(createdRoom, roomData) {
    this._engine.displayLoadingUI();
    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    const room = new Room(scene, this._userName, roomData, this._socket, createdRoom);

    room.onStart.add((createdPlayer) => {
      this._createCharacter = createdPlayer;
      this._goToCutScene();
    })

    room.onBack.add(() => {
      this._socket.emit("user_leave");
      this._goToMainMenu();
    })
    


    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();
    //lastly set the current state to the start state and set the scene to the start scene
    this._scene.dispose();
    this._scene = scene;
    this._state = states.ROOM;
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
    
    const ui = new Hud(scene);
    this._ui = ui;
    this._input = new PlayerInput(scene, this._gamepadManager);

    //primitive character and setting
    await this._initializeGameAsync(scene);

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    // scene.getMeshByName("outer").position = scene.getTransformNodeByName("startPosition").getAbsolutePosition();
    scene.getMeshByName("outer2").position = new Vector3(5, 0, 5);

    this._ui.startTimer();

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

      //--IMPORTING MESH--
      return SceneLoader.ImportMeshAsync(null, "./models/", "lightPlayerTest.gltf", scene).then((result) =>{
        const root = result.meshes[0];
        const skeleton = result.skeletons[0];
        //body is our actual player mesh
        const body = root;
        body.parent = outer;
        body.isPickable = true;
        body.getChildMeshes().forEach(m => {
            m.isPickable = true;
        })
              
        //return the mesh and animations
        return {
            mesh: outer,
            skeleton: skeleton,
            animationGroups: result.animationGroups
        }
      });
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

      //--IMPORTING MESH--
      return SceneLoader.ImportMeshAsync(null, "./models/", "lightPlayerTest.glb", scene).then((result) =>{
        const root = result.meshes[0];
        const skeleton = result.skeletons[0];
        //body is our actual player mesh
        const body = root;
        body.parent = outer;
        body.isPickable = true;
        body.getChildMeshes().forEach(m => {
            m.isPickable = true;
        })
              
        //return the mesh and animations
        return {
          mesh: outer,
          skeleton: skeleton,
          animationGroups: result.animationGroups
        }
      });
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
    scene.onBeforeRenderObservable.add(() => {
      // when the game isn't paused, update the timer
      if (!this._ui.gamePaused) {
          this._ui.updateHud();
      }
    });

    //Create the player
    this._playerTwo = new LightPlayer('2', this.playerTwoAssets, scene, shadowGenerator, null, this._ui);
    this._playerOne = new this._createCharacter('1', this.playerOneAssets, scene, shadowGenerator, this._input, this._ui); 
    console.log(this._playerOne);
    const camera = this._playerOne.activatePlayerCamera();
    this._ui.initializeHealthBar('1', this._playerOne.getPlayerHealth());
    this._ui.initializeHealthBar('2', this._playerTwo.getPlayerHealth());
    this._playerOne.setOpponent(this._playerTwo);
    this._playerTwo.setOpponent(this._playerOne);
  }
}

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}



export default () => (
  <div>
    <SceneComponent antialias myScene={BabylonScene} id="my-canvas" />
  </div>
);