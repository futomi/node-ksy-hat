/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-sht3x.js
* - Sensirion SHT30 (Humidity and Temperature Sensor)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';

class KsyHatSht3x {
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
    this._I2C_ADDR = 0x44;
  }

  /* ------------------------------------------------------------------
  * init()
  * - Initialize the Sensirion SHT30 (Humidity and Temperature Sensor)
  * - Set the Periodic Data Acquisition Mode
  *
  * [Arguments]
  * - params          | Object | Optional |
  *   - repeatability | String | Optional | Repeatability
  *                   |        |          | - The value must be any on of "High", "Medium", "Low".
  *                   |        |          | - The value is case-insensitive.
  *                   |        |          | - The default value is "High".
  *   - frequency     | Float  | Optional | Data acquisition frequency
  *                   |        |          | - The value must be any on of 0.5, 1, 2, 4, 10.
  *                   |        |          | - The unit is mps (measurements per second).
  *                   |        |          | - The default value is 1 mps.
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async init(params = {}) {
    // Check the parameters
    let rep = ('repeatability' in params) ? params.repeatability : 'High';
    let fre = ('frequency' in params) ? params.frequency : 1;

    if (typeof (rep) !== 'string') {
      throw new Error('The `repeatability` must be a string.');
    }
    rep = rep.toLowerCase();
    if (!/^(high|medium|low)$/.test(rep)) {
      throw new Error('The `repeatability` must be any one of "Hight", "Medium", "Low".');
    }

    if (typeof (fre) !== 'number') {
      throw new Error('The `frequency` must be a number.');
    }
    if (!/^(0.5|1|2|4|10)$/.test(fre.toString())) {
      throw new Error('The `frequency` must be any one of 0.5, 1, 2, 4, 10.');
    }

    // Set the Periodic Data Acquisition Mode
    let byte1 = 0;
    let byte2 = 0;

    if (fre === 0.5) {
      byte1 = 0x20;
      if (rep === 'high') {
        byte2 = 0x32;
      } else if (rep === 'medium') {
        byte2 = 0x24;
      } else if (rep === 'low') {
        byte2 = 0x2F;
      }

    } else if (fre === 1) {
      byte1 = 0x21;
      if (rep === 'high') {
        byte2 = 0x30;
      } else if (rep === 'medium') {
        byte2 = 0x26;
      } else if (rep === 'low') {
        byte2 = 0x2D;
      }

    } else if (fre === 2) {
      byte1 = 0x22;
      if (rep === 'high') {
        byte2 = 0x36;
      } else if (rep === 'medium') {
        byte2 = 0x20;
      } else if (rep === 'low') {
        byte2 = 0x2B;
      }

    } else if (fre === 4) {
      byte1 = 0x23;
      if (rep === 'high') {
        byte2 = 0x34;
      } else if (rep === 'medium') {
        byte2 = 0x22;
      } else if (rep === 'low') {
        byte2 = 0x29;
      }

    } else if (fre === 10) {
      byte1 = 0x27;
      if (rep === 'high') {
        byte2 = 0x37;
      } else if (rep === 'medium') {
        byte2 = 0x21;
      } else if (rep === 'low') {
        byte2 = 0x2A;
      }
    }

    const buf = Buffer.from([byte1, byte2]);
    await this._i2c.i2cWrite(this._I2C_ADDR, buf.length, buf);
  }

  /* ------------------------------------------------------------------
  * read()
  * - Read the latest measurements from the SHT30
  *
  * [Arguments]
  * - None
  * 
  * [Returen value]
  * - Promise object
  *   An object as below will be passed to the `resolve()`.
  *   {
  *     "temperature": 28.3, // degC
  *     "humidity": 43.2     // %RH
  *   }
  * ---------------------------------------------------------------- */
  async read() {
    // Readout of Measurement Results for Periodic Mode
    const wbuf = Buffer.from([0xE0, 0x00]);
    await this._i2c.i2cWrite(this._I2C_ADDR, wbuf.length, wbuf);

    await this._wait(100);

    const rbuf = Buffer.alloc(6);
    await this._i2c.i2cRead(this._I2C_ADDR, rbuf.length, rbuf);

    // Temperature
    let temp = -45 + 175 * rbuf.readUInt16BE(0) / (Math.pow(2, 16) - 1);
    temp = Math.round(temp * 10) / 10;
    if (rbuf[2] !== this._calcCrc8(rbuf.subarray(0, 2))) {
      throw new Error('CRC ERROR');
    }

    // Humidity
    let humi = 100 * rbuf.readUInt16BE(3) / (Math.pow(2, 16) - 1);
    humi = Math.round(humi * 10) / 10;
    if (rbuf[5] !== this._calcCrc8(rbuf.subarray(3, 5))) {
      throw new Error('CRC ERROR');
    }

    return {
      temperature: temp,
      humidity: humi
    };
  }

  _calcCrc8(buf) {
    let crc = 0xFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let bit = 8; bit > 0; --bit) {
        if (crc & 0x80) {
          crc = (crc << 1) ^ 0x31;
        } else {
          crc = (crc << 1);
        }
        crc = crc % 256;
      }
    }
    return crc;
  }

  _wait(msec) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, msec);
    });
  }

}

module.exports = KsyHatSht3x;
