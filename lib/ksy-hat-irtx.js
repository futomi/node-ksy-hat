/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-irtx.js
* - OSRAM SFH 4726AS A01 (IR Emitter)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';

class KsyHatIrtx {
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
    this._gpio = gpio;
    this._PIN_NUMBER = 11; // BCM naming
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
    await this._gpio.setup(this._PIN_NUMBER, this._gpio.DIR_OUT);
  }

  /* ------------------------------------------------------------------
  * setState()
  * - Set the LED to on or off state
  *
  * [Arguments]
  * - state | Boolean | Required | `true`: on, `false` off
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async setState(state) {
    if(typeof(state) !== 'boolean') {
      throw new Error('The `state` must be boolean.');
    }
    await this._gpio.write(this._PIN_NUMBER, state);
  }

}

module.exports = KsyHatIrtx;
