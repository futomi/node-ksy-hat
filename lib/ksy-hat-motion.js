/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-motion.js
* - MURATA IRA-S210ST01 (IR Motion Sensor)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';
const EventEmitter = require('events')

class KsyHatMotion extends EventEmitter {
  /* ------------------------------------------------------------------
  * Constructor
  *
  * [Arguments]
  * - gpio | Object | Required | `Gpio` object (Promise version) of the `rpi-gpio` module
  * 
  * `rpi-gpio` module 
  *   https://www.npmjs.com/package/rpi-gpio
  * ---------------------------------------------------------------- */
  constructor(gpio) {
    super();
    this._gpio = gpio;
    this._PIN_NUMBER_T = 9;  // T_OUT (Moving detection output): BCM naming
    this._PIN_NUMBER_D = 10; // D_OUT (Comparator output): BCM naming
    this._callbackT = () => { };
    this._callbackD = () => { };
  }

  /* ------------------------------------------------------------------
  * init()
  * - Set up the GPIO pins
  *
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async init() {
    await this._gpio.setup(this._PIN_NUMBER_T, this._gpio.DIR_IN, this._gpio.EDGE_BOTH);
    await this._gpio.setup(this._PIN_NUMBER_D, this._gpio.DIR_IN, this._gpio.EDGE_BOTH);
    this._gpio.on('change', (channel, value) => {
      if (channel === this._PIN_NUMBER_T) {
        this._callbackT(value);
      } else if (channel === this._PIN_NUMBER_D) {
        this._callbackD(value);
      }
    });
  }

  /* ------------------------------------------------------------------
  * start()
  * - Start to monitor the status of the switch
  *
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - None
  * ---------------------------------------------------------------- */
  start() {
    this._callbackT = (value) => {
      this.emit('detected', { output: 'T', value: value });
    };
    this._callbackD = (value) => {
      this.emit('detected', { output: 'D', value: value });
    };
  }

  /* ------------------------------------------------------------------
  * stop()
  * - Stop to monitor the status of the switch
  *
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - None
  * ---------------------------------------------------------------- */
  stop() {
    this._callbackT = () => { };
    this._callbackD = () => { };
  }

}

module.exports = KsyHatMotion;
