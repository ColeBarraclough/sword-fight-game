import { AdvancedDynamicTexture, TextBlock, StackPanel, Rectangle} from "@babylonjs/gui";



export class Hud {
    static ROUND_LENGTH = 300; //in seconds
    constructor(scene) {
        this._scene = scene;
        this._prevTime = 0;
        const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this._playerUI = playerUI;
        this._playerUI.idealHeight = 720;

        const stackPanel = new StackPanel();
        stackPanel.height = "100%";
        stackPanel.width = "100%";
        stackPanel.top = "14px";
        stackPanel.verticalAlignment = 0;
        playerUI.addControl(stackPanel);

        const health1Panel = new StackPanel();
        health1Panel.height = "100%";
        health1Panel.width = "100%";
        health1Panel.top = "14px";
        health1Panel.left = "-35%";
        health1Panel.horizontalAlignment = 0;
        // health1Panel.isVertical = false;
        playerUI.addControl(health1Panel);

        const health2Panel = new StackPanel();
        health2Panel.height = "100%";
        health2Panel.width = "100%";
        health2Panel.top = "14px";
        health2Panel.left = "35%";
        health2Panel.verticalAlignment = 0;
        // health2Panel.isVertical = false;
        playerUI.addControl(health2Panel);

        const clockTime = new TextBlock();
        clockTime.name = "clock";
        clockTime.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        clockTime.fontSize = "48px";
        clockTime.color = "white";
        clockTime.text = "11:00";
        clockTime.resizeToFit = true;
        clockTime.height = "96px";
        clockTime.width = "220px";
        clockTime.fontFamily = "Viga";
        stackPanel.addControl(clockTime);
        this._clockTime = clockTime;

        var healthBar1Text = new TextBlock();
        healthBar1Text.fontSize = "48px";
        healthBar1Text.color = "white";
        healthBar1Text.text = "0";
        healthBar1Text.resizeToFit = true;
        healthBar1Text.height = "96px";
        healthBar1Text.width = "220px";
        healthBar1Text.fontFamily = "Viga";
        var healthBar1 = this._createHealthBar();
        health1Panel.addControl(healthBar1Text);
        health1Panel.addControl(healthBar1);

        var healthBar2Text = new TextBlock();
        healthBar2Text.fontSize = "48px";
        healthBar2Text.color = "white";
        healthBar2Text.text = "0";
        healthBar2Text.resizeToFit = true;
        healthBar2Text.height = "96px";
        healthBar2Text.width = "220px";
        healthBar2Text.fontFamily = "Viga";
        var healthBar2 = this._createHealthBar();
        health2Panel.addControl(healthBar2Text);
        health2Panel.addControl(healthBar2);

        this._healthUI = {
            '1': {healthBar: healthBar1, healthText: healthBar1Text, startingHealth: 0},
            '2': {healthBar: healthBar2, healthText: healthBar2Text, startingHealth: 0}
        }
    }

    updateHud() {
        if (!this._stopTimer && this.time != null) {
            let curTime = this.time - this._scene.getEngine().getDeltaTime() / 1000; // divide by 1000 to get seconds

            this.time = curTime; //keeps track of the total time elapsed in seconds
            if (this.time <= 0) {
                this._stopTimer = true;
            }
            this._clockTime.text = this._formatTime(curTime);
        }
    }

    _formatTime(time) {
        let minsPassed = Math.floor(time / 60); //seconds in a min 
        let seconds = Math.floor(time - minsPassed * 60); 
        
        return (minsPassed ? minsPassed + ":" + ('0' + seconds).slice(-2) : seconds + '');
    }

    //---- Game Timer ----
    startTimer() {
        this.time = Hud.ROUND_LENGTH; //get the time when we started
        this._stopTimer = false;
    }

    stopTimer() {
        this._stopTimer = true; //controls the update of our timer
    }

    _createHealthBar() {
        var rect1 = new Rectangle();
        
        rect1.width = 0.2;
        rect1.height = "40px";
        rect1.cornerRadius = 20;
        rect1.color = "Orange";
        rect1.thickness = 4;
        rect1.background = "green";
        return rect1;   
    }


    initializeHealthBar(player ,startHealth) {
        this._healthUI[player].startingHealth = startHealth;
        this._healthUI[player].healthText.text = startHealth + '';
    }
    changeHealth(newHealth) {
        this._healthUI['2'].healthBar.width = 0.2 * newHealth/this._healthUI['2'].startingHealth;
        this._healthUI['2'].healthText.text = newHealth + '';
    }
}