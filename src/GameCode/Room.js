import {Button, Control, InputText, StackPanel, TextBlock, RadioButton, AdvancedDynamicTexture} from "@babylonjs/gui";
import { Observable } from "@babylonjs/core";
import {LightPlayer, HeavyPlayer} from "./Player"
import {PeerConnection} from "./Peer-Connection"

class Room {
    constructor(scene, user, roomData, socket, createdRoom) {
        this._scene = scene
        this._user = user;
        if (roomData != null) {
            this._peerUser = {userId: roomData.userId, username: roomData.username};
        }
        this._username = user.username;
        this._guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this._guiMenu.idealHeight = 720; //fit our fullscreen ui to this height
        
        this._roomData = roomData;
        this._socket = socket;
        this._socket.on('sdp', (sdpInfo) => {
            this._onSdp(sdpInfo)
        });
        this._socket.on('ice_candidate', (candidate) => {
            this._onIceCandidate(candidate)
        });

        // this._socket.on('sdp', this._onSdp);
        // this._socket.on('ice_candidate', this._onIceCandidate);

        this.onStart = new Observable();
        this.onBack = new Observable();
        if (createdRoom) {
            this._createRoom();
        } else {
            this._joinRoom();
        }
        this._createRoomGui();
    }

    _createRoom() {
        const roomNameInput = new InputText();
        roomNameInput.width = 0.2;
        roomNameInput.maxWidth = 0.2;
        roomNameInput.paddingTop = "50px";
        roomNameInput.height = "40px";
        roomNameInput.placeholderText = "Choose a Room name";
        roomNameInput.placeholderColor = "grey";
        roomNameInput.color = "black";
        roomNameInput.background = "white";
        roomNameInput.focusedBackground = "white";
        roomNameInput.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._guiMenu.addControl(roomNameInput);
        roomNameInput.onBlurObservable.add(() => {
          this._socket.emit("room_name_change", {id: this._socket.id, name: roomNameInput.text});
        });
  
        const startBtn = new Button.CreateSimpleButton("start", "Start");
        startBtn.height = "100px";
        startBtn.width = "100px";
        startBtn.isEnabled = false;
        startBtn.background = "green";
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        startBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        startBtn.onPointerDownObservable.add(() => {
            this._startGame();
        });
        this._guiMenu.addControl(startBtn);

  
        this._socket.on("user_ready", () => {
          startBtn.isEnabled = true;
        })
    }

    _joinRoom() {
        const roomsText = new TextBlock();
        roomsText.height = "100px";
        roomsText.width = 1;
        roomsText.text = this._roomData.roomName;
        roomsText.color = "white";
        roomsText.fontSize = 24;
        roomsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._guiMenu.addControl(roomsText);
  
        const readyBtn = new Button.CreateSimpleButton("ready", "Ready");
        readyBtn.height = "100px";
        readyBtn.width = "100px";
        readyBtn.background = "green";
        readyBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        readyBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        readyBtn.onPointerDownObservable.add(() => {
            this._createPeerConnection(false);
            this._socket.emit("user_ready", "");
        });
        this._guiMenu.addControl(readyBtn);


    }

    _createRoomGui() {
        const playersStack = new StackPanel();
        playersStack.height = "300px";
        playersStack.width = "300px";
        playersStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._guiMenu.addControl(playersStack);
        const playerOneText = new TextBlock();
        playerOneText.height = "150px";
        playerOneText.width = "300px";
        playerOneText.color = "white";
        playerOneText.fontSize = 24;
        playerOneText.text = this._username;
        playersStack.addControl(playerOneText);
        const playerTwoText = new TextBlock();
        playerTwoText.height = "150px";
        playerTwoText.width = "300px";
        playerTwoText.color = "white";
        playerTwoText.fontSize = 24;
        if (this._roomData != null) {
          playerTwoText.text = this._roomData.username;
        }
        playersStack.addControl(playerTwoText);
        this._socket.on('user_join', (userInfo) => {
            this._peerUser = userInfo;
            playerTwoText.text = userInfo.username;
        })
        this._socket.on("user_leave", () => {
            this._peerUser = null;
            playerTwoText.text = "";
        })
    
        const characterStack = new StackPanel();
        characterStack.height = "300px";
        characterStack.width = "300px";
        characterStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this._guiMenu.addControl(characterStack);    
        const lightplayerBtn = new RadioButton();
        lightplayerBtn.width = "20px";
        lightplayerBtn.height = "20px";
        lightplayerBtn.color = "white";
        lightplayerBtn.background = "green";
        const header1 = Control.AddHeader(lightplayerBtn, "Light", "100px", { isHorizontal: true, controlFirst: true });
        header1.color = "white";
        header1.height = "30px";
        lightplayerBtn.onIsCheckedChangedObservable.add(() => 
        {
          this._createCharacter = LightPlayer;  
        });
        characterStack.addControl(lightplayerBtn); 
        const heavyplayerBtn = new RadioButton();
        heavyplayerBtn.width = "20px";
        heavyplayerBtn.height = "20px";
        heavyplayerBtn.color = "white";
        heavyplayerBtn.background = "green";
        const header = Control.AddHeader(heavyplayerBtn, "Heavy", "100px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";
        heavyplayerBtn.onIsCheckedChangedObservable.add(() => 
        {
            this._createCharacter = HeavyPlayer;  
        });
        characterStack.addControl(heavyplayerBtn); 

        const backBtn = Button.CreateImageOnlyButton("refresh", "images/backArrow.png");
        backBtn.height = "70px";
        backBtn.width = "70px";
        backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        backBtn.paddingRight = "5px";
        backBtn.paddingTop = "5px";
        backBtn.onPointerDownObservable.add(() => {
            this.onBack.notifyObservers();
        });
        this._guiMenu.addControl(backBtn);
    }

    _startGame() {
        this._createPeerConnection(true);
    }

    _createPeerConnection(initiator) {
        this._peer = new PeerConnection(this._socket, this._user, this._peerUser, initiator);
        this._peer.onDataChannelReady.add((e) => {
            this.onStart.notifyObservers({peerConnection: this._peer, createCharacter: this._createCharacter});
        });
    }

    _onSdp(sdpInfo) {
        this._pendingSdp = sdpInfo.sdp;
        this._peer.setSdp(sdpInfo.sdp);
    }

    _onIceCandidate(message) {
        var userId = message.userId;
        if (!this._peer) {
          this.log('Adding pending candidate from another player. id =' + userId, 'gray');
          if (!this.pendingCandidates[userId]) {
            this.pendingCandidates[userId] = [];
          }
          this.pendingCandidates[userId].push(message.candidate);
          return;
        }
        this._peer.addIceCandidate(message.candidate);
      }

}

export {Room}