/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-led.js
* - Everlight EASV3015RGBA0 (PCB Side View SMD LED Red-Green-Blue)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';

class KsyHatLed {
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
    this._PIN = { r: 27, g: 17, b: 15 }; // BCM naming
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
    for (const c of ['r', 'g', 'b']) {
      await this._gpio.setup(this._PIN[c], this._gpio.DIR_OUT);
    }
  }

  /* ------------------------------------------------------------------
  * setStates()
  * - Set the LEDs to on or off state
  *
  * [Arguments]
  * - params | Object | Optional |
  *   - r    | Boolean | Optional | `true`: on, `false` off
  *   - g    | Boolean | Optional | `true`: on, `false` off
  *   - b    | Boolean | Optional | `true`: on, `false` off
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async setStates(params = {}) {
    const rgb = {};
    for (const c of ['r', 'g', 'b']) {
      if (c in params) {
        const v = params[c];
        if (typeof (v) !== 'boolean') {
          throw new Error('The `' + c + '` must be boolean.');
        }
        rgb[c] = v;
      }
    }
    for (const [k, v] of Object.entries(rgb)) {
      await this._gpio.write(this._PIN[k], v);
    }
  }

}

module.exports = KsyHatLed;
