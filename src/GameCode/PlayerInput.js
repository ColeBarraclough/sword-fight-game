import { Scene, ActionManager ,GamepadManager, ExecuteCodeAction, Observer, Scalar, Xbox360Pad, StickValues} from '@babylonjs/core';

export class PlayerInput {
    
    constructor(scene, gamepadManager) {
        this.DEAD_ZONE = 0.10;
        this.leftValues = new StickValues(0,0);
        this.i = 0;

        gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
            gamepad.onleftstickchanged((values) => {
                this._updateFromController(values);
            });
        });

        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};

        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    _updateFromKeyboard() {

        if (this.inputMap["w"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
    
        } else if (this.inputMap["s"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap["a"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
    
        } else if (this.inputMap["d"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
    }

    _updateFromController(leftValues) {
        if (Math.sqrt(Math.pow(leftValues.x, 2) + Math.pow(leftValues.y, 2)) > this.DEAD_ZONE) {
            this.conHorizontal = leftValues.x;
            this.conVertical = -leftValues.y;
        } else {
            this.conHorizontal = 0;
            this.conVertical = 0;
        }

        
        
    }

}