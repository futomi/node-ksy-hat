/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-switch.js
* - ALPS ALPINE SKRTLAE010 (TACT Switch)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';
const EventEmitter = require('events')

class KsyHatSwitch extends EventEmitter {
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
    this._PIN_NUMBER = 14; // BCM naming
    this._callback = () => { };
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
    await this._gpio.setup(this._PIN_NUMBER, this._gpio.DIR_IN, this._gpio.EDGE_BOTH);
    this._gpio.on('change', (channel, value) => {
      if (channel === this._PIN_NUMBER) {
        this._callback(value);
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
    this._callback = (released) => {
      this.emit('pressed', !released);
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
    this._callback = () => { };
  }

}

module.exports = KsyHatSwitch;
