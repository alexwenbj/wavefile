/*
 * Copyright (c) 2017-2019 Rafael da Silva Rocha.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

/**
 * @fileoverview The WaveFile class.
 * @see https://github.com/rochars/wavefile
 */

/** @module wavefile */

import {encode, decode} from 'base64-arraybuffer-es6';
import WaveFileConverter from './lib/wavefile-converter';
import fixRIFFTag from './lib/fix-riff-tag';

/**
 * A class to manipulate wav files.
 * @extends WaveFileConverter
 */
export default class WaveFile extends WaveFileConverter {

  /**
   * Use a .wav file encoded as a base64 string to load the WaveFile object.
   * @param {string} base64String A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  fromBase64(base64String) {
    this.fromBuffer(new Uint8Array(decode(base64String)));
  }

  /**
   * Return a base64 string representig the WaveFile object as a .wav file.
   * @return {string} A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  toBase64() {
    /** @type {!Uint8Array} */
    let buffer = this.toBuffer();
    return encode(buffer, 0, buffer.length);
  }

  /**
   * Return a DataURI string representig the WaveFile object as a .wav file.
   * The return of this method can be used to load the audio in browsers.
   * @return {string} A .wav file as a DataURI.
   * @throws {Error} If any property of the object appears invalid.
   */
  toDataURI() {
    return 'data:audio/wav;base64,' + this.toBase64();
  }

  /**
   * Use a .wav file encoded as a DataURI to load the WaveFile object.
   * @param {string} dataURI A .wav file as DataURI.
   * @throws {Error} If any property of the object appears invalid.
   */
  fromDataURI(dataURI) {
    this.fromBase64(dataURI.replace('data:audio/wav;base64,', ''));
  }

  /**
   * Write a RIFF tag in the INFO chunk. If the tag do not exist,
   * then it is created. It if exists, it is overwritten.
   * @param {string} tag The tag name.
   * @param {string} value The tag value.
   * @throws {Error} If the tag name is not valid.
   */
  setTag(tag, value) {
    tag = fixRIFFTag(tag);
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      this.LIST[index.LIST].subChunks[index.TAG].chunkSize =
        value.length + 1;
      this.LIST[index.LIST].subChunks[index.TAG].value = value;
    } else if (index.LIST !== null) {
      this.LIST[index.LIST].subChunks.push({
        chunkId: tag,
        chunkSize: value.length + 1,
        value: value});
    } else {
      this.LIST.push({
        chunkId: 'LIST',
        chunkSize: 8 + value.length + 1,
        format: 'INFO',
        subChunks: []});
      this.LIST[this.LIST.length - 1].subChunks.push({
        chunkId: tag,
        chunkSize: value.length + 1,
        value: value});
    }
  }

  /**
   * Remove a RIFF tag from the INFO chunk.
   * @param {string} tag The tag name.
   * @return {boolean} True if a tag was deleted.
   */
  deleteTag(tag) {
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      this.LIST[index.LIST].subChunks.splice(index.TAG, 1);
      return true;
    }
    return false;
  }

  /**
   * Create a cue point in the wave file.
   * @param {number} position The cue point position in milliseconds.
   * @param {string} labl The LIST adtl labl text of the marker. Optional.
   */
  setCuePoint(position, labl='') {
    this.cue.chunkId = 'cue ';
    position = (position * this.fmt.sampleRate) / 1000;
    /** @type {!Array<!Object>} */
    let existingPoints = this.getCuePoints_();
    this.clearLISTadtl_();
    /** @type {number} */
    let len = this.cue.points.length;
    this.cue.points = [];
    /** @type {boolean} */
    let hasSet = false;
    if (len === 0) {
      this.setCuePoint_(position, 1, labl);
    } else {
      for (let i = 0; i < len; i++) {
        if (existingPoints[i].dwPosition > position && !hasSet) {
          this.setCuePoint_(position, i + 1, labl);
          this.setCuePoint_(
            existingPoints[i].dwPosition,
            i + 2,
            existingPoints[i].label);
          hasSet = true;
        } else {
          this.setCuePoint_(
            existingPoints[i].dwPosition,
            i + 1,
            existingPoints[i].label);
        }
      }
      if (!hasSet) {
        this.setCuePoint_(position, this.cue.points.length + 1, labl);
      }
    }
    this.cue.dwCuePoints = this.cue.points.length;
  }

  /**
   * Remove a cue point from a wave file.
   * @param {number} index the index of the point. First is 1,
   *    second is 2, and so on.
   */
  deleteCuePoint(index) {
    this.cue.chunkId = 'cue ';
    /** @type {!Array<!Object>} */
    let existingPoints = this.getCuePoints_();
    this.clearLISTadtl_();
    /** @type {number} */
    let len = this.cue.points.length;
    this.cue.points = [];
    for (let i = 0; i < len; i++) {
      if (i + 1 !== index) {
        this.setCuePoint_(
          existingPoints[i].dwPosition,
          i + 1,
          existingPoints[i].label);
      }
    }
    this.cue.dwCuePoints = this.cue.points.length;
    if (this.cue.dwCuePoints) {
      this.cue.chunkId = 'cue ';
    } else {
      this.cue.chunkId = '';
      this.clearLISTadtl_();
    }
  }

  /**
   * Update the label of a cue point.
   * @param {number} pointIndex The ID of the cue point.
   * @param {string} label The new text for the label.
   */
  updateLabel(pointIndex, label) {
    /** @type {?number} */
    let cIndex = this.getAdtlChunk_();
    if (cIndex !== null) {
      for (let i = 0, len = this.LIST[cIndex].subChunks.length; i < len; i++) {
        if (this.LIST[cIndex].subChunks[i].dwName ==
            pointIndex) {
          this.LIST[cIndex].subChunks[i].value = label;
        }
      }
    }
  }

  /**
   * Push a new cue point in this.cue.points.
   * @param {number} position The position in milliseconds.
   * @param {number} dwName the dwName of the cue point
   * @private
   */
  setCuePoint_(position, dwName, label) {
    this.cue.points.push({
      dwName: dwName,
      dwPosition: position,
      fccChunk: 'data',
      dwChunkStart: 0,
      dwBlockStart: 0,
      dwSampleOffset: position,
    });
    this.setLabl_(dwName, label);
  }

  /**
   * Clear any LIST chunk labeled as 'adtl'.
   * @private
   */
  clearLISTadtl_() {
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == 'adtl') {
        this.LIST.splice(i);
      }
    }
  }

  /**
   * Create a new 'labl' subchunk in a 'LIST' chunk of type 'adtl'.
   * @param {number} dwName The ID of the cue point.
   * @param {string} label The label for the cue point.
   * @private
   */
  setLabl_(dwName, label) {
    /** @type {?number} */
    let adtlIndex = this.getAdtlChunk_();
    if (adtlIndex === null) {
      this.LIST.push({
        chunkId: 'LIST',
        chunkSize: 4,
        format: 'adtl',
        subChunks: []});
      adtlIndex = this.LIST.length - 1;
    }
    this.setLabelText_(adtlIndex === null ? 0 : adtlIndex, dwName, label);
  }

  /**
   * Create a new 'labl' subchunk in a 'LIST' chunk of type 'adtl'.
   * @param {number} adtlIndex The index of the 'adtl' LIST in this.LIST.
   * @param {number} dwName The ID of the cue point.
   * @param {string} label The label for the cue point.
   * @private
   */
  setLabelText_(adtlIndex, dwName, label) {
    this.LIST[adtlIndex].subChunks.push({
      chunkId: 'labl',
      chunkSize: label.length,
      dwName: dwName,
      value: label
    });
    this.LIST[adtlIndex].chunkSize += label.length + 4 + 4 + 4 + 1;
  }
}
