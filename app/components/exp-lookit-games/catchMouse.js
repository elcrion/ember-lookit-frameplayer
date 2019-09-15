/*
 * Developed by Gleb Iakovlev on 5/3/19 9:09 PM.
 * Last modified 4/29/19 11:02 PM.
 * Copyright (c) Cognoteq Software Solutions 2019.
 * All rights reserved
 */

import Base from './base';


/**
 *
 * @submodule games
 *
 */
let mice = {};
let clockObject = {};
let basket = {};
let initBallY = 0.27;
let initX = 1.33;
let initialTime = 0;
let jitterT = 0;


let sounds = [];
let soundURLs = [];
let imageURLs = [];
let images = [];

const gameSound = {
  START: 0,
  SERIES1: 1,
  SERIES2: 2,
  SERIES3: 3,
  SWOOSH: 4,
  FAIL: 5
};
const gameImage = {
  PADDLE: 0,
  TARGET: 1,
  CLOCK: 2,
  CLOCK_EMPTY: 3
};

/**
 * @class CatchMouse
 * @extends Base
 * Main implementation of Catch the mouse game.
 * The user will with paddle (basket) to catch the mice.
 * The mice will appear with some unpredictable  delay.
 * The user should catch the mice until cheese(symbolizing the clock) is gone.
 */
export default class CatchMouse extends Base {
  /**
   * @method constructor
   * @constructor constructor
   * @param context Context of the game
   * @param document
   */
  constructor(context, document) {

    super(context, document);
    soundURLs = [super.Utils.drumRollSound, super.Utils.cheese_ser1Sound, super.Utils.cheese_ser2Sound, super.Utils.cheese_ser3Sound, super.Utils.swooshSound, super.Utils.ballcatchFailSound] ;
    imageURLs = [super.Utils.rectangleCage, super.Utils.rat, super.Utils.pizza,super.Utils.cheeseMissedImage];
  }


  /**
   *
   * Main point to start the game.
   * Initialize static parameters and preload sounds here
   * @method init
   */
  init() {
    document.addEventListener("mousemove", super.onMouseMove);

    super.fillAudioArray(soundURLs,sounds);
    super.fillImageArray(imageURLs,images);

    //Target coordinate
    let leftBorder = (initX - 0.08) * super.Utils.SCALE;
    let topBorder = (1.2971 - initBallY) * super.Utils.SCALE;

    mice = {
      dimensions: {width: 0.18 * super.Utils.SCALE, height: 0.18 * super.Utils.SCALE},
      position: {x: leftBorder, y: topBorder},
      radius: 0.09525 * super.Utils.SCALE,
      delay: 2000,
      state: 'start',
      showTime: 0,
      lastTime: new Date().getTime()
    };


    basket = {
      dimensions: {width: 0, height: 0},
      position: {
        x: 0,
        y: 0
      },
      positions: [],
      times: [],
      moved: 0,
      paddleLastMovedMillis: 0
    };


    this.setCheeseObj();

    sounds[gameSound.START].addEventListener('onloadeddata', this.initGame(), false);
    sounds[gameSound.START].addEventListener('playing', function () {
      initialTime = new Date().getTime();

    });

    super.init();

  }


  setCheeseObj() {

    //Cheese coord
    let leftBorder = (1.53)*super.Utils.SCALE ;
    let topBorder = (1.2974-initBallY)*super.Utils.SCALE;
    let width = 0.27777 * super.Utils.SCALE;
    let height = 0.26031 * super.Utils.SCALE;

    clockObject = {
      dimensions: {width: width, height: height},
      position: {x: leftBorder ,y: topBorder},
      angle: 0,
      state:10,
      velocity: 1.4
    };

  }



  /**
   *
   * Initialize each game round with initial object parameters
   * Randomize number of obstructions
   * Reset the sounds sources for older browser versions
   * @method initGame
   */
  initGame() {
    initialTime = 0;
    jitterT = super.trialStartTime();
    mice.state = 'start';
    mice.lastTime = new Date().getTime();

    this.setCheeseObj();
    super.createPaddleBox();
    basket = super.basketObject(basket);
    if (super.currentRounds > 0 || (super.currentRounds === 0 && !super.paddleIsMoved(basket))) {
      sounds[gameSound.START].play();
    }

    super.initGame();
  }


  /**
   * @method  dataCollection Collect data
   */
  dataCollection() {
    super.dataCollection();
    let exportData = {
      game_type: 'catchMouse',
      basket_x: basket.position.x / this.canvas.width,
      basket_y: (this.canvas.height - basket.position.y) / this.canvas.height,
      mice_x: mice.position.x / this.canvas.width,
      mice_y: (this.canvas.height - mice.position.y) / this.canvas.height,
      trial: super.currentRounds,
      mice_state: mice.state,
      timestamp: new Date().getTime()

    };

    super.storeData(exportData);

  }


  /**
   *
   *  Show cheese portion according to angle
   *  @method showCheese
   */
  showCheese() {

    let angle = Math.PI * (0.2 * clockObject.state);
    this.ctx.beginPath();
    let margin = clockObject.dimensions.width * 0.2;
    this.ctx.moveTo(clockObject.position.x + clockObject.dimensions.width / 2, clockObject.position.y + clockObject.dimensions.height / 2);
    this.ctx.fillStyle = super.Utils.blackColor;
    this.ctx.arc(clockObject.position.x + clockObject.dimensions.width / 2, clockObject.position.y + clockObject.dimensions.height / 2, clockObject.dimensions.height / 2 + margin, angle, Math.PI * 2, false);
    this.ctx.lineTo(clockObject.position.x + clockObject.dimensions.width / 2, clockObject.position.y + clockObject.dimensions.height / 2);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }


  cheeseState() {

    let time = super.getElapsedTime(mice.showTime);

    if (time < 0.1) {
      clockObject.state = 9;
    } else if (time < 0.2) {
      clockObject.state = 8;
    } else if (time < 0.3) {

      clockObject.state = 7;
    } else if (time < 0.4) {

      clockObject.state = 6;
    } else if (time < 0.5) {

      clockObject.state = 5;
    } else if (time < 0.6) {

      clockObject.state = 4;
    } else if (time < 0.7) {

      clockObject.state = 3;
    } else if (time < 0.8) {

      clockObject.state = 2;

    } else if (time < 0.9) {

      clockObject.state = 1;

    } else {
      clockObject.state = 0;
    }
    this.showCheese();
  }


  /**
   *
   * Main loop of the game.
   * Set initial position of the ball in a box and starting rattling sound (initSoundPlaying).
   * After that  start showing the mouse.
   * Increase the score if ball hits the target.
   * @method loop
   */
  loop() {
    super.loop();
    let paddleBoxColor = super.Utils.blueColor;
    super.createPaddleBox(paddleBoxColor);
    basket = super.basketObject(basket);
    super.paddleMove(basket, initialTime, mice);
    super.drawImageObject(clockObject, images[gameImage.CLOCK]);

    if (initialTime === 0 && super.currentRounds === 0 && !super.paddleIsMoved(basket)) {

      sounds[gameSound.START].play();
    }


    if (initialTime > 0 && super.paddleIsMoved(basket) && mice.state === 'start') {
      initialTime = new Date().getTime();
      paddleBoxColor = super.Utils.redColor;
      super.createPaddleBox(paddleBoxColor);
    }

    //Randomize initial wait time here
    if (mice.state === 'start' && initialTime > 0 && super.getElapsedTime(initialTime) > jitterT) {
      sounds[gameSound.START].pause();
      sounds[gameSound.START].currentTime = 0;
      mice.state = 'show';
      mice.showTime = new Date().getTime();
    }

    if (mice.state === 'show') {
      this.cheeseState();
      super.drawImageObject(mice, images[gameImage.TARGET]);

    }

    if (mice.state === 'done') {


      super.paddleAtZero(basket, false);


    }

    if (mice.state === 'show') {


      if (mice.showTime > 0 && super.getElapsedTime(mice.showTime) > 1) {

        mice.state = 'done';
        sounds[gameSound.FAIL].play();
      }


      if (basket.moved === 0 && basket.positions.length > 5 && basket.position.y - mice.position.y <= 100) {

        sounds[gameSound.SWOOSH].play();
        basket.moved = 1;

      }


      if ((mice.position.y + 20) - basket.position.y >= 0) {
        mice.state = 'done';
        if (clockObject.state > 0) {
          if (clockObject.state < 4) {
            sounds[gameSound.SERIES1].play();
          } else if (clockObject.state >= 4 && clockObject.state < 8) {
            sounds[gameSound.SERIES2].play();
          } else {
            sounds[gameSound.SERIES3].play();
          }
          super.increaseScore();
          this.showCheese();

        }


      }


    }

    this.showCheese();
    this.drawImage(basket, images[gameImage.PADDLE]);
  }

}
