/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-veml7700.js
* - VISHAY VEML7700-TT (Ambient Light Sensor)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';

class KsyHatVeml7700 {
  /* ------------------------------------------------------------------
  * Constructor
  *
  * [Arguments]
  * - i2c | Object | Required | `PromisifiedBus` object of the `i2c-bus` module
  * 
  * `i2c-bus` module 
  *   https://www.npmjs.com/package/i2c-bus
  * ---------------------------------------------------------------- */
  constructor(i2c) {
    this._i2c = i2c;
    this._I2C_ADDR = 0x10;
  }

  /* ------------------------------------------------------------------
  * init()
  * - Initialize the VISHAY VEML7700-TT (Ambient Light Sensor)
  *
  * [Arguments]
  * - none
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async init() {
    // ----------------------------------------------------------------
    // ALS_CONF 0 (ALS gain, integration time, interrupt, and shutdown)
    // - bit 15-13 : Set 000b
    // - bit 12-11 : Gain selection
    //               00 = ALS gain x 1, 01 = ALS gain x 2, 10 = ALS gain x (1/8), 11 = ALS gain x (1/4))
    // - bit 10    : Set 0b
    // - bit 09-06 : ALS integration time setting
    //               1100 = 25 ms, 1000 = 50 ms, 0000 = 100 ms, 0001 = 200 ms, 0010 = 400 ms, 0011 = 800 ms
    // - bit 05-04 : ALS persistence protect number setting
    //               00 = 1, 01 = 2, 10 = 4, 11 = 8
    // - bit 03-02  : Set 00b
    // - bit 01     : ALS interrupt enable setting
    //                0 = ALS INT disable, 1 = ALS INT enable
    // - bit 00     : ALS shut down setting
    //                0 = ALS power on, 1 = ALS shut down
    // ----------------------------------------------------------------
    // ALS gain x (1/8), integration time 25ms (Little Endian)
    await this._writeI2cData(0x00, [0b00000000, 0b00010011]);

    // ----------------------------------------------------------------
    // ALS_WH (ALS high threshold window setting)
    // ----------------------------------------------------------------
    await this._writeI2cData(0x01, [0x00, 0x00]);

    // ----------------------------------------------------------------
    // ALS_WL (ALS low threshold window setting)
    // ----------------------------------------------------------------
    await this._writeI2cData(0x02, [0x00, 0x00]);

    // ----------------------------------------------------------------
    // PSM (Power Saving Mode)
    // - bit 15-03 : reserved
    // - bit 02-01 : Power saving mode; see table "Refresh time"
    //               00 = mode 1, 01 = mode 2, 10 = mode 3, 11 = mode 4
    // - bit 00    : Power saving mode enable setting
    //               0 = disable, 1 = enable
    // ----------------------------------------------------------------
    await this._writeI2cData(0x03, [0x00, 0x00]);
  }

  async _writeI2cData(cmd, bytes) {
    const buf = Buffer.from(bytes);
    await this._i2c.writeI2cBlock(this._I2C_ADDR, cmd, buf.length, buf);
  }

  /* ------------------------------------------------------------------
  * read()
  * - Read the latest illuminance from the VEML7700-TT
  *
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   An object as below will be passed to the `resolve()`.
  *   {
  *     "illuminance": 149.3 // lux
  *   }
  * ---------------------------------------------------------------- */
  async read() {
    let ill = await this._i2c.readWord(this._I2C_ADDR, 0x04);
    ill = Math.round(ill * 1.8432 * 10) / 10;

    return {
      illuminance: ill
    };
  }
}

module.exports = KsyHatVeml7700;
