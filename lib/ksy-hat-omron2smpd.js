/* ------------------------------------------------------------------
* node-ksy-hat - ksy-hat-omron2smpd.js
* - OMRON 2SMPB-02E (Absolute Pressure Sensor)
*
* Copyright (c) 2022, Futomi Hatano, All rights reserved.
* Released under the MIT license
* ---------------------------------------------------------------- */
'use strict';

class KsyHatOmron2smpd {
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
    this._I2C_ADDR = 0x70;
  }

  /* ------------------------------------------------------------------
  * init()
  * - Initialize the OMRON 2SMPB-02E (Absolute Pressure Sensor)
  *
  * [Arguments]
  * - none
  * 
  * [Returen value]
  * - Promise object
  *   Nothing will be passed to the `resolve()`.
  * ---------------------------------------------------------------- */
  async init() {
    // ---------------------------------------------------
    // IO_SETUP ： I/O 設定用レジスタ
    // 0x00: 0b 0000 0000
    // - bit 7-5 t_stanby[2:0] スタンバイ時間(Typ.)の設定
    //           000: 1ms
    // - bit 4-3 Reserved 未使用です。書き込み時は0を設定
    // - bit 2   spi3_sdim SPI3線通信時のSDI出力形式を切り替えます。
    //           0: Lo / Hi-Z出力 (Default)
    // - bit 1   Reserved 未使用です。書き込み時は0を設定
    // - bit 0   spi3w SPI通信時の3線/4線を切り替えます。
    //           0: 4線 (Default)
    // ---------------------------------------------------
    await this._i2c.writeByte(this._I2C_ADDR, 0xF5, 0x00);

    // ---------------------------------------------------
    // CTRL_MEAS : 測定条件設定用レジスタ
    // 0x27: 0b 0010 0111
    // - bit 7-5 temp_average[2:0] 温度データの平均処理回数
    //           001: 1 回
    // - bit 4-2 press_average[2:0] 圧力データの平均処理回数
    //           001: 1 回
    // - bit 1-0 power_mode[1:0] 動作モードの設定
    //           11: Normal モード
    // ---------------------------------------------------
    await this._i2c.writeByte(this._I2C_ADDR, 0xF4, 0x27);
  }

  async _readI2cData(cmd, len = 2) {
    const buf = Buffer.alloc(len);
    await this._i2c.readI2cBlock(this._I2C_ADDR, cmd, buf.length, buf);
    return buf;
  }

  /* ------------------------------------------------------------------
  * read()
  * - Read the latest measurements from the OMRON 2SMPB-02E
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
    const dp = await this._readRawPress();
    const tr = await this._readTr();

    // COE_b00_1
    const coe_b00 = await this._readI2cData(0xa0);

    // COE_b00_a0_ex
    const b00_a0_ex = await this._readI2cData(0xb8, 1)

    let b00 = (coe_b00[0] << 12 | coe_b00[1] << 4 | b00_a0_ex[0] >> 4);
    b00 = -(b00 & 0b10000000000000000000) | (b00 & 0b01111111111111111111);
    b00 = this._conv_K1(b00);

    // COE_bt1_1
    const coe_bt1 = await this._readI2cData(0xa2);

    let bt1 = (coe_bt1[0] << 8 | coe_bt1[1]);
    bt1 = -(bt1 & 0b1000000000000000) | (bt1 & 0b0111111111111111);
    bt1 = this._conv_K0(bt1, 1.0e-1, 9.1e-2);

    // COE_bt2_1
    const coe_bt2 = await this._readI2cData(0xa4);

    let bt2 = (coe_bt2[0] << 8 | coe_bt2[1])
    bt2 = -(bt2 & 0b1000000000000000) | (bt2 & 0b0111111111111111);
    bt2 = this._conv_K0(bt2, 1.2e-8, 1.2e-6);

    // COE_bp1_1
    const coe_bp1 = await this._readI2cData(0xa6);

    let bp1 = (coe_bp1[0] << 8 | coe_bp1[1]);
    bp1 = -(bp1 & 0b1000000000000000) | (bp1 & 0b0111111111111111);
    bp1 = this._conv_K0(bp1, 3.3e-2, 1.9e-2);

    // COE_b11_1
    const coe_b11 = await this._readI2cData(0xa8);

    let b11 = (coe_b11[0] << 8 | coe_b11[1]);
    b11 = -(b11 & 0b1000000000000000) | (b11 & 0b0111111111111111);
    b11 = this._conv_K0(b11, 2.1e-7, 1.4e-7);

    // COE_bp2_1
    const coe_bp2 = await this._readI2cData(0xaa);

    let bp2 = (coe_bp2[0] << 8 | coe_bp2[1]);
    bp2 = -(bp2 & 0b1000000000000000) | (bp2 & 0b0111111111111111);
    bp2 = this._conv_K0(bp2, -6.3e-10, 3.5e-10);

    // COE_b12_1
    const coe_b12 = await this._readI2cData(0xac);

    let b12 = (coe_b12[0] << 8 | coe_b12[1]);
    b12 = -(b12 & 0b1000000000000000) | (b12 & 0b0111111111111111);
    b12 = this._conv_K0(b12, 2.9e-13, 7.6e-13);

    // COE_b21_1
    const coe_b21 = await this._readI2cData(0xae);

    let b21 = (coe_b21[0] << 8 | coe_b21[1]);
    b21 = -(b21 & 0b1000000000000000) | (b21 & 0b0111111111111111);
    b21 = this._conv_K0(b21, 2.1e-15, 1.2e-14);

    // COE_bp3_1
    const coe_bp3 = await this._readI2cData(0xb0);

    let bp3 = (coe_bp3[0] << 8 | coe_bp3[1]);
    bp3 = -(bp3 & 0b1000000000000000) | (bp3 & 0b0111111111111111);
    bp3 = this._conv_K0(bp3, 1.3e-16, 7.9e-17);

    const pr = b00 + bt1 * tr + bp1 * dp + b11 * dp * tr + bt2 * Math.pow(tr, 2) + bp2 * Math.pow(dp, 2) + b12 * dp * Math.pow(tr, 2) + b21 * Math.pow(dp, 2) * tr + bp3 * Math.pow(dp, 3);

    const press = pr / 100.0;
    const temp = tr / 256.0;

    return {
      pressure: Math.round(press * 10) / 10,
      temperature: Math.round(temp * 10) / 10
    };
  }

  async _readRawTemp() {
    // TEMP_TXD2 : Temperature DATA [24:17] in 24 bits
    const temp_txd2 = await this._readI2cData(0xfa, 1);

    // TEMP_TXD1 : Temperature DATA [16:9] in 24 bits
    const temp_txd1 = await this._readI2cData(0xfb, 1);

    // TEMP_TXD0 : Temperature DATA [8:1] in 24 bits
    const temp_txd0 = await this._readI2cData(0xfc, 1);

    const dt = (temp_txd2[0] << 16 | temp_txd1[0] << 8 | temp_txd0[0]) - Math.pow(2, 23);
    return dt;
  }

  async _readRawPress() {
    // PRESS_TXD2
    const press_txd2 = await this._readI2cData(0xf7, 1);

    // PRESS_TXD1
    const press_txd1 = await this._readI2cData(0xf8, 1);

    // PRESS_TXD0
    const press_txd0 = await this._readI2cData(0xf9, 1);

    const dp = (press_txd2[0] << 16 | press_txd1[0] << 8 | press_txd0[0]) - Math.pow(2, 23);
    return dp;
  }

  async _readTr() {
    const dt = await this._readRawTemp();

    // COE_a0_1
    const coe_a0 = await this._readI2cData(0xb2);

    // COE_b00_a0_ex
    const b00_a0_ex = await this._readI2cData(0xb8);

    let a0 = (coe_a0[0] << 12 | coe_a0[1] << 4 | b00_a0_ex[0] & 0x0f);
    a0 = -(a0 & 0b10000000000000000000) | (a0 & 0b01111111111111111111);
    a0 = this._conv_K1(a0);

    // COE_a1_1
    const coe_a1 = await this._readI2cData(0xb4);

    let a1 = (coe_a1[0] << 8 | coe_a1[1]);
    a1 = -(a1 & 0b1000000000000000) | (a1 & 0b0111111111111111);
    a1 = this._conv_K0(a1, -6.3e-3, 4.3e-4);

    // COE_a2_1
    const coe_a2 = await this._readI2cData(0xb6);

    let a2 = (coe_a2[0] << 8 | coe_a2[1]);
    a2 = -(a2 & 0b1000000000000000) | (a2 & 0b0111111111111111);
    a2 = this._conv_K0(a2, -1.9e-11, 1.2e-10);

    const tr = a0 + (a1 + a2 * dt) * dt;
    return tr;
  }

  _conv_K0(x, a, s) {
    return (a + (((s * x) / 32767.0)));
  }

  _conv_K1(x) {
    return (x / 16.0);
  }

}

module.exports = KsyHatOmron2smpd;
