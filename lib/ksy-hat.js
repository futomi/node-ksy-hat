/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat.js
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';
const mI2cBus = require('i2c-bus');
const mRpiGpio = require('rpi-gpio');
const mRpiGpioPromise = mRpiGpio.promise;
const mKsyHatLed = require('./ksy-hat-led.js');
const mKsyHatSwitch = require('./ksy-hat-switch.js');
const mKsyHatMotion = require('./ksy-hat-motion.js');
const mKsyHatIrtx = require('./ksy-hat-irtx.js');
const mKsyHatSht3x = require('./ksy-hat-sht3x.js');
const mKsyHatVeml7700 = require('./ksy-hat-veml7700.js');
const mKsyHatOmron2smpd = require('./ksy-hat-omron2smpd.js');

class KsyHat {
  /* ------------------------------------------------------------------
  * Cotructor
  *
  * [Arguments]
  * - None
  * ---------------------------------------------------------------- */
  constructor() {
    this._initialized = false;
    this._i2c = null;
    this._led = null;         // Everlight EASV3015RGBA0 (PCB Side View SMD LED Red-Green-Blue)
    this._switch = null;      // ALPS ALPINE SKRTLAE010 (TACT Switch)
    this._motion = null;      // MURATA IRA-S210ST01 (IR Motion Sensor)
    this._irtx = null;        // OSRAM SFH 4726AS A01 (IR Emitter)
    this._sht3x = null;       // Sensirion SHT30 (Humidity and Temperature Sensor)
    this._veml7700 = null;    // VISHAY VEML7700-TT (Ambient Light Sensor)
    this._omron2smpd = null;  // OMRON 2SMPB-02E (Absolute Pressure Sensor)
  }

  get led() {
    if (this._led) {
      return this._led;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get switch() {
    if (this._switch) {
      return this._switch;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get motion() {
    if (this._motion) {
      return this._motion;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get irtx() {
    if (this._irtx) {
      return this._irtx;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get sht3x() {
    if (this._sht3x) {
      return this._sht3x;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get veml7700() {
    if (this._veml7700) {
      return this._veml7700;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  get omron2smpd() {
    if (this._omron2smpd) {
      return this._omron2smpd;
    } else {
      throw new Error('The `KsyHat` object has not been initialized. Call the `init()` method in advance.');
    }
  }

  /* ------------------------------------------------------------------
  * init()
  * - Initialize this object.
  * 
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async init() {
    // -------------------------------------------
    // GPIO
    // -------------------------------------------
    mRpiGpio.setMode(mRpiGpio.MODE_BCM);

    // Everlight EASV3015RGBA0 (PCB Side View SMD LED Red-Green-Blue)
    this._led = new mKsyHatLed(mRpiGpioPromise);
    await this._led.init();

    // ALPS ALPINE SKRTLAE010 (TACT Switch)
    this._switch = new mKsyHatSwitch(mRpiGpioPromise);
    await this._switch.init();

    // MURATA IRA-S210ST01 (IR Motion Sensor)
    this._motion = new mKsyHatMotion(mRpiGpioPromise);
    await this._motion.init();

    // OSRAM SFH 4726AS A01 (IR Emitter)
    this._irtx = new mKsyHatIrtx(mRpiGpioPromise);
    await this._irtx.init();

    // -------------------------------------------
    // I2C
    // -------------------------------------------
    const i2c = await mI2cBus.openPromisified(1);
    this._i2c = i2c;

    // Sensirion SHT30 (Humidity and Temperature Sensor)
    this._sht3x = new mKsyHatSht3x(i2c);
    await this._sht3x.init();

    // VISHAY VEML7700-TT (Ambient Light Sensor)
    this._veml7700 = new mKsyHatVeml7700(i2c);
    await this._veml7700.init();

    // OMRON 2SMPB-02E (Absolute Pressure Sensor)
    this._omron2smpd = new mKsyHatOmron2smpd(i2c);
    await this._omron2smpd.init();

    this._initialized = true;
  }

  /* ------------------------------------------------------------------
  * readSensorData()
  * - Read measurements from all of the I2C-based sensors
  * 
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   An object will be passed to the `resolve()` as follows:
  * 
  * ---------------------------------------------------------------- */
  async readSensorData() {
    const sht3x_data = await this._sht3x.read();
    const veml7700_data = await this._veml7700.read();
    const omron2smpd_data = await this._omron2smpd.read();
    const data = Object.assign({}, veml7700_data, omron2smpd_data, sht3x_data);
    return data;
  }


  /* ------------------------------------------------------------------
  * destroy()
  * 
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async destroy() {
    mRpiGpioPromise.removeAllListeners();
    await mRpiGpioPromise.destroy();
    await this._i2c.close();

    this._initialized = false;
    this._i2c = null;
    this._led = null;
    this._switch = null;
    this._motion = null;
    this._irtx = null;
    this._sht3x = null;
    this._veml7700 = null;
    this._omron2smpd = null;
  }

  /* ------------------------------------------------------------------
  * wait()
  * 
  * [Arguments]
  * - msec | Integer | Required | msec
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  wait(msec) {
    if (typeof (msec) !== 'number' || msec % 1 !== 0) {
      throw new Error('The `msec` must be an integer.');
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, msec);
    });
  }


}
module.exports = KsyHat;