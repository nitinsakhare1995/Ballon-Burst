let config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scene: { preload, create, update }
};
let game = new Phaser.Game(config);


let balloon, balloonText, pumpPress, pumpRelease, pumpContainer, balloonString;
let pumpPressOriginalY;

let pumpCount = 0;
const maxPump = 10;
const initialScale = 0.08;
const maxScale = 0.3;
const pumpScale = 0.5;
let floating = false;

function preload() {
    
    this.load.image('background', './Graphics/background.png');
    this.load.image('pump_container', './Graphics/pump_container.png');
    this.load.image('pump_press', './Graphics/pump_press.png');
    this.load.image('pump_release', './Graphics/pump_release.png');
    this.load.image('balloon_string', './Graphics/balloon_string.png');
    for (let i = 1; i <= 10; i++) { this.load.image(`balloon${i}`, `./Graphics/balloon${i}.png`); }
    for (let charCode = 65; charCode <= 90; charCode++) {
        let letter = String.fromCharCode(charCode);
        this.load.image(`letter_${letter}`, `./Graphics/${letter}.png`);
    }
}

function create() {
    this.add.image(config.width / 2, config.height / 2, 'background').setDisplaySize(config.width, config.height);

    let pumpContainerX = config.width - 90;
    let pumpContainerY = config.height - 80;
    
    pumpContainer = this.add.image(pumpContainerX, pumpContainerY, 'pump_container')
                      .setOrigin(0.5, 0.5).setScale(pumpScale);;

    let pressOffsetY_Adjustment = 80;
    
    pumpPress = this.add.image(
        pumpContainer.x,
        (pumpContainer.y - pumpContainer.displayHeight / 2) + pressOffsetY_Adjustment,'pump_press').setOrigin(0.5, 1).setScale(pumpScale).setInteractive(); 
    pumpPressOriginalY = pumpPress.y;

    let nozzleOffsetX = 103; 
    let nozzleOffsetY = -20; 

    pumpRelease = this.add.image(
        pumpContainer.x - pumpContainer.displayWidth / 2 + nozzleOffsetX,
        pumpContainer.y + nozzleOffsetY, 'pump_release').setOrigin(1, 0.5).setScale(pumpScale); 
    pumpRelease.setVisible(true);

    let balloonOffsetX = -pumpRelease.displayWidth + 65; 
    let balloonOffsetY = -65; 

    spawnBalloon(this, pumpRelease.x + balloonOffsetX, pumpRelease.y + balloonOffsetY);

    pumpPress.on('pointerdown', () => {
        if (!floating && pumpPress.y === pumpPressOriginalY) {
             let pressAmount = 10 * pumpScale;
             this.tweens.add({
                 targets: pumpPress,
                 y: pumpPressOriginalY + pressAmount,
                 duration: 100,
                 ease: 'Linear',
                 yoyo: true,
                 onComplete: () => { if(pumpPress) pumpPress.y = pumpPressOriginalY; }
             });

            if (balloon && balloon.active && pumpCount < maxPump) {
                pumpCount++;
                let targetScale = initialScale + (maxScale - initialScale) * (pumpCount / maxPump);
                 this.tweens.add({
                     targets: [balloon, balloonString, balloonText],
                     scaleX: targetScale,
                     scaleY: targetScale,
                     duration: 100,
                     ease: 'Linear'
                 });
                 balloon.y -= 1;
                 updateBalloonAttachments();
                if (pumpCount >= maxPump) { startFloating(); }
            }
        }
    });
}



function spawnBalloon(scene, balloonInitialX, balloonInitialY) {
    pumpCount = 0;
    floating = false;

    let randomBalloonIndex = Phaser.Math.Between(1, 10);
    let randomLetterChar = String.fromCharCode(Phaser.Math.Between(65, 90));

    if (balloon) balloon.destroy();
    if (balloonString) balloonString.destroy();
    if (balloonText) balloonText.destroy();

    balloon = scene.physics.add.sprite(balloonInitialX, balloonInitialY, `balloon${randomBalloonIndex}`);
    balloon.setScale(initialScale);
    balloon.setOrigin(0.5, 1); 

    balloonString = scene.add.image(balloon.x, balloon.y, 'balloon_string');
    balloonString.setScale(initialScale);
    balloonString.setOrigin(0.5, 0); 

    balloonText = scene.add.image(balloon.x, balloon.y, `letter_${randomLetterChar}`);
    balloonText.setScale(initialScale);
    balloonText.setOrigin(0.5, 0.5);

    updateBalloonAttachments();

    balloon.setInteractive();
    balloon.on('pointerdown', () => {
        if (floating) {
            burstBalloon(scene);
        }
    });
}


function startFloating() {
    if (!balloon || !balloon.active) return;
    floating = true;
    balloon.setOrigin(0.5, 0.5); 
    balloon.body.setCollideWorldBounds(true);
    balloon.body.setBounce(1, 1);
    let velocityX = Phaser.Math.Between(-60, 60);
    let velocityY = Phaser.Math.Between(-180, -100);
    balloon.setVelocity(velocityX, velocityY);
}

function burstBalloon(scene) {
    if (balloon) balloon.destroy();
    if (balloonString) balloonString.destroy();
    if (balloonText) balloonText.destroy();

    balloon = null;
    balloonString = null;
    balloonText = null;
    floating = false;
    pumpCount = 0;

    scene.time.delayedCall(1000, () => {
        if(pumpRelease && pumpRelease.active) {
            let nozzleOffsetX = 22; 
            let nozzleOffsetY = -10;
            let balloonOffsetX = -pumpRelease.displayWidth + 65;
            let balloonOffsetY = -64;
            spawnBalloon(scene, pumpRelease.x + balloonOffsetX, pumpRelease.y + balloonOffsetY);
        }
    });
}

function updateBalloonAttachments() {
     if (balloon && balloon.active) {
        balloonString.x = balloon.x;
        balloonText.x = balloon.x;
        if (balloon.originY === 1) { 
            balloonString.y = balloon.y;
            balloonText.y = balloon.y - balloon.displayHeight / 2;
        } else { 
            balloonString.y = balloon.y + (balloon.displayHeight / 2) ;
            balloonText.y = balloon.y;
        }
        
        if (!this.tweens || !this.tweens.isTweening(balloon)) { 
             balloonString.setScale(balloon.scaleX, balloon.scaleY);
             balloonText.setScale(balloon.scaleX, balloon.scaleY);
        }
        else if (scene.tweens && scene.tweens.isTweening(balloon)){
            balloonString.setScale(balloon.scaleX, balloon.scaleY);
            balloonText.setScale(balloon.scaleX, balloon.scaleY);
        }
    }
}

function update() {
    updateBalloonAttachments();
    if (floating && balloon && balloon.active) {
        if (balloon.y < -balloon.displayHeight ||
            balloon.x < -balloon.displayWidth / 2 ||
            balloon.x > config.width + balloon.displayWidth / 2)
        {
             burstBalloon(this);
        }
    }
}
