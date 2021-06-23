import { Scene, ActionManager ,GamepadManager, ExecuteCodeAction, Scalar, Xbox360Pad, Xbox360Button} from '@babylonjs/core';

export class PlayerInput {
    static LEFT_STICK_DEAD_ZONE = 0.10;
    static RIGHT_STICK_DEAD_ZONE = 0.5;
    static RIGHT_TRIGGER_DEAD_ZONE = 0.0;
    static LEFT_TRIGGER_DEAD_ZONE = 0.0;

    constructor(scene, gamepadManager) {
        this.i = 0;
        this.attacking = false;
        this.specialOne = false;
        this.comboExt = false;
        this.rightStickPos = 9;
        gamepadManager.onGamepadConnectedObservable.add((gamepad, state)=>{
            gamepad.onleftstickchanged((values) => {
                this._updateFromLeftStick(values);
            });
            gamepad.onrightstickchanged((values) => {
                this._updateFromRightStick(values);
            });
            if (gamepad instanceof Xbox360Pad) {
                gamepad.onrighttriggerchanged((value) => {
                    if (value > PlayerInput.RIGHT_TRIGGER_DEAD_ZONE) {
                        this.attacking = true;
                    } else {
                        this.attacking = false;
                    }
                });
                gamepad.onlefttriggerchanged((value) => {
                    if (value > PlayerInput.LEFT_TRIGGER_DEAD_ZONE) {
                        this.comboExt = true;
                    } else {
                        this.comboExt = false;
                    }
                });
                gamepad.onButtonDownObservable.add((button, state)=>{
                    if (Xbox360Button[button] == "A") {
                        this.specialOne = true;
                    }
                });
                gamepad.onButtonUpObservable.add((button, state) => {
                    if (Xbox360Button[button] == "A") {
                        this.specialOne = false;
                    }
                })

            }
        });

        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};

        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        // scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.On, (evt) => {
        //     this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        // }));

    
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

    _updateFromLeftStick(leftValues) {
        if (Math.sqrt(Math.pow(leftValues.x, 2) + Math.pow(leftValues.y, 2)) > PlayerInput.LEFT_STICK_DEAD_ZONE) {
            this.conHorizontal = leftValues.x;
            this.conVertical = -leftValues.y;
        } else {
            this.conHorizontal = 0;
            this.conVertical = 0;
        }

        
        
    }

    /**
     * The right stick in the game will take the form of an octogon
     *            2
     *          #####
     *         #     #
     *     1  #       #  3
     *       #         #
     *      #           #
     *      #           #
     *   0  #           #  4
     *      #           #
     *      #           #
     *       #         #
     *    7   #       #  5
     *         #     #
     *          #####
     *            6 
     * Each face is given a number and the number is determined by the amount of radians
     * divided by PI/4 and floored to the integer. Since the x and y stick values
     * are from -PI to PI and inverted in the way you would normally think they must first
     * be added by PI + PI/8 to be able to be divided by PI/4 and fit this pattern
     * @param StickValues rightValues 
     */

    _updateFromRightStick(rightValues) {
        this.rightValues = rightValues;
        if (Math.sqrt(Math.pow(rightValues.x, 2) + Math.pow(rightValues.y, 2)) > PlayerInput.RIGHT_STICK_DEAD_ZONE) {
            this.rightStickPos = Math.floor((Math.PI + Math.PI/8 + Math.atan2(rightValues.y, rightValues.x))/(Math.PI/4));
            if (this.rightStickPos == 8) {
                this.rightStickPos = 0;
            }

        } else {
            this.rightStickPos = 9;
        }
    }
}