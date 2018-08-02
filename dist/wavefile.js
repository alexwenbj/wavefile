/*
 * bitdepth: Change the resolution of samples to and from any bit depth.
 * https://github.com/rochars/bitdepth
 *
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * @fileoverview The bitdepth() function and private helper functions.
 */

/** @module bitdepth */

/** @private */
const f64f32_ = new Float32Array(1);

/**
 * Change the bit depth of samples. The input array.
 * @param {!TypedArray} input The samples.
 * @param {string} original The original bit depth of the data.
 *      One of "8" ... "53", "32f", "64"
 * @param {string} target The desired bit depth for the data.
 *      One of "8" ... "53", "32f", "64"
 * @param {!TypedArray} output The output array.
 */
function bitDepth(input, original, target, output) {
  validateBitDepth_(original);
  validateBitDepth_(target);
  /** @type {!Function} */
  let toFunction = getBitDepthFunction_(original, target);
  /** @type {!Object<string, number>} */
  let options = {
    oldMin: Math.pow(2, parseInt(original, 10)) / 2,
    newMin: Math.pow(2, parseInt(target, 10)) / 2,
    oldMax: (Math.pow(2, parseInt(original, 10)) / 2) - 1,
    newMax: (Math.pow(2, parseInt(target, 10)) / 2) - 1,
  };
  /** @type {number} */
  const len = input.length;
  // sign the samples if original is 8-bit
  if (original == "8") {
    for (let i=0; i<len; i++) {
      output[i] = input[i] -= 128;
    }
  }
  // change the resolution of the samples
  for (let i=0; i<len; i++) {        
    output[i] = toFunction(input[i], options);
  }
  // unsign the samples if target is 8-bit
  if (target == "8") {
    for (let i=0; i<len; i++) {
      output[i] = output[i] += 128;
    }
  }
}

/**
 * Change the bit depth from int to int.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the original and target bit depths.
 * @return {number}
 * @private
 */
function intToInt_(sample, args) {
  if (sample > 0) {
    sample = parseInt((sample / args.oldMax) * args.newMax, 10);
  } else {
    sample = parseInt((sample / args.oldMin) * args.newMin, 10);
  }
  return sample;
}

/**
 * Change the bit depth from float to int.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the original and target bit depths.
 * @return {number}
 * @private
 */
function floatToInt_(sample, args) {
  return parseInt(
    sample > 0 ? sample * args.newMax : sample * args.newMin, 10);
}

/**
 * Change the bit depth from int to float.
 * @param {number} sample The sample.
 * @param {!Object<string, number>} args Data about the original and target bit depths.
 * @return {number}
 * @private
 */
function intToFloat_(sample, args) {
  return sample > 0 ? sample / args.oldMax : sample / args.oldMin;
}

/**
 * Change the bit depth from float to float.
 * @param {number} sample The sample.
 * @return {number}
 * @private
 */
function floatToFloat_(sample) {
  f64f32_[0] = sample;
  return f64f32_[0];
}

/**
 * Return the function to change the bit depth of a sample.
 * @param {string} original The original bit depth of the data.
 *      One of "8" ... "53", "32f", "64"
 * @param {string} target The new bit depth of the data.
 *      One of "8" ... "53", "32f", "64"
 * @return {!Function}
 * @private
 */
function getBitDepthFunction_(original, target) {
  /** @type {!Function} */
  let func = function(x) {return x;};
  if (original != target) {
    if (["32f", "64"].includes(original)) {
      if (["32f", "64"].includes(target)) {
        func = floatToFloat_;
      } else {
        func = floatToInt_;
      }
    } else {
      if (["32f", "64"].includes(target)) {
        func = intToFloat_;
      } else {
        func = intToInt_;
      }
    }
  }
  return func;
}

/**
 * Validate the bit depth.
 * @param {string} bitDepth The original bit depth.
 *     Should be one of "8" ... "53", "32f" or "64".
 * @throws {Error} If any argument does not meet the criteria.
 * @private
 */
function validateBitDepth_(bitDepth) {
  if ((bitDepth != "32f" && bitDepth != "64") &&
      (parseInt(bitDepth, 10) < "8" || parseInt(bitDepth, 10) > "53")) {
    throw new Error("Invalid bit depth.");
  }
}

/*
 * imaadpcm: IMA ADPCM codec in JavaScript.
 * Derived from https://github.com/acida/pyima  
 * Copyright (c) 2016 acida. MIT License.  
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview imaadpcm API and private methods.
 */

/** @module imaadpcm */

/**
 * @type {!Array<number>}
 * @private
 */
const INDEX_TABLE = [
    -1, -1, -1, -1, 2, 4, 6, 8,
    -1, -1, -1, -1, 2, 4, 6, 8];
/**
 * @type {!Array<number>}
 * @private
 */
const STEP_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14,
    16, 17, 19, 21, 23, 25, 28, 31,
    34, 37, 41, 45, 50, 55, 60, 66,
    73, 80, 88, 97, 107, 118, 130, 143,
    157, 173, 190, 209, 230, 253, 279, 307,
    337, 371, 408, 449, 494, 544, 598, 658,
    724, 796, 876, 963, 1060, 1166, 1282, 1411,
    1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024,
    3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484,
    7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899,
    15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794,
    32767];
/**
 * @type {number}
 * @private
 */
let encoderPredicted_ = 0;
/**
 * @type {number}
 * @private
 */
let encoderIndex_ = 0;
/**
 * @type {number}
 * @private
 */
let decoderPredicted_ = 0;
/**
 * @type {number}
 * @private
 */
let decoderIndex_ = 0;
/**
 * @type {number}
 * @private
 */
let decoderStep_ = 7;

/**
 * Encode 16-bit PCM samples into 4-bit IMA ADPCM samples.
 * @param {!Int16Array} samples A array of samples.
 * @return {!Uint8Array}
 */
function encode(samples) {
  /** @type {!Uint8Array} */
  let adpcmSamples = new Uint8Array((samples.length / 2) + 512);
  /** @type {!Array<number>} */
  let block = [];
  /** @type {number} */
  let fileIndex = 0;
  for (let i=0; i<samples.length; i++) {
    if ((i % 505 == 0 && i != 0)) {
      adpcmSamples.set(encodeBlock(block), fileIndex);
      fileIndex += 256;
      block = [];
    }
    block.push(samples[i]);
  }
  return adpcmSamples;
}

/**
 * Decode IMA ADPCM samples into 16-bit PCM samples.
 * @param {!Uint8Array} adpcmSamples A array of ADPCM samples.
 * @param {number} blockAlign The block size.
 * @return {!Int16Array}
 */
function decode(adpcmSamples, blockAlign=256) {
  /** @type {!Int16Array} */
  let samples = new Int16Array(adpcmSamples.length * 2);
  /** @type {!Array<number>} */
  let block = [];
  /** @type {number} */
  let fileIndex = 0;
  for (let i=0; i<adpcmSamples.length; i++) {
    if (i % blockAlign == 0 && i != 0) {            
      samples.set(decodeBlock(block), fileIndex);
      fileIndex += blockAlign * 2;
      block = [];
    }
    block.push(adpcmSamples[i]);
  }
  return samples;
}

/**
 * Encode a block of 505 16-bit samples as 4-bit ADPCM samples.
 * @param {!Array<number>} block A sample block of 505 samples.
 * @return {!Array<number>}
 */
function encodeBlock(block) {
  /** @type {!Array<number>} */
  let adpcmSamples = blockHead_(block[0]);
  for (let i=3; i<block.length; i+=2) {
    /** @type {number} */
    let sample2 = encodeSample_(block[i]);
    /** @type {number} */
    let sample = encodeSample_(block[i + 1]);
    adpcmSamples.push((sample << 4) | sample2);
  }
  while (adpcmSamples.length < 256) {
    adpcmSamples.push(0);
  }
  return adpcmSamples;
}

/**
 * Decode a block of ADPCM samples into 16-bit PCM samples.
 * @param {!Array<number>} block A adpcm sample block.
 * @return {!Array<number>}
 */
function decodeBlock(block) {
  decoderPredicted_ = sign_((block[1] << 8) | block[0]);
  decoderIndex_ = block[2];
  decoderStep_ = STEP_TABLE[decoderIndex_];
  /** @type {!Array<number>} */
  let result = [
      decoderPredicted_,
      sign_((block[3] << 8) | block[2])
    ];
  for (let i=4; i<block.length; i++) {
    /** @type {number} */
    let original_sample = block[i];
    /** @type {number} */
    let second_sample = original_sample >> 4;
    /** @type {number} */
    let first_sample = (second_sample << 4) ^ original_sample;
    result.push(decodeSample_(first_sample));
    result.push(decodeSample_(second_sample));
  }
  return result;
}

/**
 * Sign a 16-bit integer.
 * @param {number} num A 16-bit integer.
 * @return {number}
 * @private
 */
function sign_(num) {
  return num > 32768 ? num - 65536 : num;
}

/**
 * Compress a 16-bit PCM sample into a 4-bit ADPCM sample.
 * @param {number} sample The sample.
 * @return {number}
 * @private
 */
function encodeSample_(sample) {
  /** @type {number} */
  let delta = sample - encoderPredicted_;
  /** @type {number} */
  let value = 0;
  if (delta >= 0) {
    value = 0;
  } else {
    value = 8;
    delta = -delta;
  }
  /** @type {number} */
  let step = STEP_TABLE[encoderIndex_];
  /** @type {number} */
  let diff = step >> 3;
  if (delta > step) {
    value |= 4;
    delta -= step;
    diff += step;
  }
  step >>= 1;
  if (delta > step) {
    value |= 2;
    delta -= step;
    diff += step;
  }
  step >>= 1;
  if (delta > step) {
    value |= 1;
    diff += step;
  }
  updateEncoder_(value, diff);
  return value;
}

/**
 * Set the value for encoderPredicted_ and encoderIndex_
 * after each sample is compressed.
 * @param {number} value The compressed ADPCM sample
 * @param {number} diff The calculated difference
 * @private
 */
function updateEncoder_(value, diff) {
  if (value & 8) {
    encoderPredicted_ -= diff;
  } else {
    encoderPredicted_ += diff;
  }
  if (encoderPredicted_ < -0x8000) {
    encoderPredicted_ = -0x8000;
  } else if (encoderPredicted_ > 0x7fff) {
    encoderPredicted_ = 0x7fff;
  }
  encoderIndex_ += INDEX_TABLE[value & 7];
  if (encoderIndex_ < 0) {
    encoderIndex_ = 0;
  } else if (encoderIndex_ > 88) {
    encoderIndex_ = 88;
  }
}

/**
 * Decode a 4-bit ADPCM sample into a 16-bit PCM sample.
 * @param {number} nibble A 4-bit adpcm sample.
 * @return {number}
 * @private
 */
function decodeSample_(nibble) {
  /** @type {number} */
  let difference = 0;
  if (nibble & 4) {
    difference += decoderStep_;
  }
  if (nibble & 2) {
    difference += decoderStep_ >> 1;
  }
  if (nibble & 1) {
    difference += decoderStep_ >> 2;
  }
  difference += decoderStep_ >> 3;
  if (nibble & 8) {
    difference = -difference;
  }
  decoderPredicted_ += difference;
  if (decoderPredicted_ > 32767) {
    decoderPredicted_ = 32767;
  } else if (decoderPredicted_ < -32767) {
    decoderPredicted_ = -32767;
  }
  updateDecoder_(nibble);
  return decoderPredicted_;
}

/**
 * Update the index and step after decoding a sample.
 * @param {number} nibble A 4-bit adpcm sample.
 * @private
 */
function updateDecoder_(nibble) {
  decoderIndex_ += INDEX_TABLE[nibble];
  if (decoderIndex_ < 0) {
    decoderIndex_ = 0;
  } else if (decoderIndex_ > 88) {
    decoderIndex_ = 88;
  }
  decoderStep_ = STEP_TABLE[decoderIndex_];
}

/**
 * Return the head of a ADPCM sample block.
 * @param {number} sample The first sample of the block.
 * @return {!Array<number>}
 * @private
 */
function blockHead_(sample) {
  encodeSample_(sample);
  /** @type {!Array<number>} */
  let adpcmSamples = [];
  adpcmSamples.push(sample & 0xFF);
  adpcmSamples.push((sample >> 8) & 0xFF);
  adpcmSamples.push(encoderIndex_);
  adpcmSamples.push(0);
  return adpcmSamples;
}

/*
 * alawmulaw: A-Law and mu-Law codecs in JavaScript.
 * https://github.com/rochars/alawmulaw
 *
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview A-Law codec.
 */

/** @module alawmulaw/alaw */

/** @type {!Array<number>} */
const LOG_TABLE = [
  1,1,2,2,3,3,3,3,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5, 
  6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6, 
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7, 
  7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7 
];

/**
 * Encode a 16-bit linear PCM sample as 8-bit A-Law.
 * @param {number} sample A 16-bit PCM sample
 * @return {number}
 */
function encodeSample(sample) {
  /** @type {number} */
  let compandedValue; 
  sample = (sample ==-32768) ? -32767 : sample;
  /** @type {number} */
  let sign = ((~sample) >> 8) & 0x80; 
  if (!sign) {
    sample = sample * -1; 
  }
  if (sample > 32635) {
    sample = 32635; 
  }
  if (sample >= 256)  {
    /** @type {number} */
    let exponent = LOG_TABLE[(sample >> 8) & 0x7F];
    /** @type {number} */
    let mantissa = (sample >> (exponent + 3) ) & 0x0F; 
    compandedValue = ((exponent << 4) | mantissa); 
  } else {
    compandedValue = sample >> 4; 
  } 
  return compandedValue ^ (sign ^ 0x55);
}

/**
 * Decode a 8-bit A-Law sample as 16-bit PCM.
 * @param {number} aLawSample The 8-bit A-Law sample
 * @return {number}
 */
function decodeSample(aLawSample) {
  /** @type {number} */
  let sign = 0;
  aLawSample ^= 0x55;
  if (aLawSample & 0x80) {
    aLawSample &= ~(1 << 7);
    sign = -1;
  }
  /** @type {number} */
  let position = ((aLawSample & 0xF0) >> 4) + 4;
  /** @type {number} */
  let decoded = 0;
  if (position != 4) {
    decoded = ((1 << position) |
      ((aLawSample & 0x0F) << (position - 4)) |
      (1 << (position - 5)));
  } else {
    decoded = (aLawSample << 1)|1;
  }
  decoded = (sign === 0) ? (decoded) : (-decoded);
  return (decoded * 8) * -1;
}

/**
 * Encode 16-bit linear PCM samples as 8-bit A-Law samples.
 * @param {!Int16Array} samples A array of 16-bit PCM samples.
 * @return {!Uint8Array}
 */
function encode$1(samples) {
  /** @type {!Uint8Array} */
  let aLawSamples = new Uint8Array(samples.length);
  for (let i=0; i<samples.length; i++) {
    aLawSamples[i] = encodeSample(samples[i]);
  }
  return aLawSamples;
}

/**
 * Decode 8-bit A-Law samples into 16-bit linear PCM samples.
 * @param {!Uint8Array} samples A array of 8-bit A-Law samples.
 * @return {!Int16Array}
 */
function decode$1(samples) {
  /** @type {!Int16Array} */
  let pcmSamples = new Int16Array(samples.length);
  for (let i=0; i<samples.length; i++) {
    pcmSamples[i] = decodeSample(samples[i]);
  }
  return pcmSamples;
}

/*
 * alawmulaw: A-Law and mu-Law codecs in JavaScript.
 * https://github.com/rochars/alawmulaw
 *
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview mu-Law codec.
 */

/** @module alawmulaw/mulaw */

/**
 * @type {number}
 * @private
 */
const BIAS = 0x84;
/**
 * @type {number}
 * @private
 */
const CLIP = 32635;
/**
 * @type {Array<number>}
 * @private
 */
const encodeTable = [
    0,0,1,1,2,2,2,2,3,3,3,3,3,3,3,3,
    4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
    7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7];
/**
 * @type {Array<number>}
 * @private
 */
const decodeTable = [0,132,396,924,1980,4092,8316,16764];

/**
 * Encode a 16-bit linear PCM sample as 8-bit mu-Law.
 * @param {number} sample A 16-bit PCM sample
 * @return {number}
 */
function encodeSample$1(sample) {
  /** @type {number} */
  let sign;
  /** @type {number} */
  let exponent;
  /** @type {number} */
  let mantissa;
  /** @type {number} */
  let muLawSample;
  /** get the sample into sign-magnitude **/
  sign = (sample >> 8) & 0x80;
  if (sign != 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  /** convert from 16 bit linear to ulaw **/
  sample = sample + BIAS;
  exponent = encodeTable[(sample>>7) & 0xFF];
  mantissa = (sample >> (exponent+3)) & 0x0F;
  muLawSample = ~(sign | (exponent << 4) | mantissa);
  /** return the result **/
  return muLawSample;
}

/**
 * Decode a 8-bit mu-Law sample as 16-bit PCM.
 * @param {number} muLawSample The 8-bit mu-Law sample
 * @return {number}
 */
function decodeSample$1(muLawSample) {
  /** @type {number} */
  let sign;
  /** @type {number} */
  let exponent;
  /** @type {number} */
  let mantissa;
  /** @type {number} */
  let sample;
  muLawSample = ~muLawSample;
  sign = (muLawSample & 0x80);
  exponent = (muLawSample >> 4) & 0x07;
  mantissa = muLawSample & 0x0F;
  sample = decodeTable[exponent] + (mantissa << (exponent+3));
  if (sign != 0) sample = -sample;
  return sample;
}

/**
 * Encode 16-bit linear PCM samples into 8-bit mu-Law samples.
 * @param {!Int16Array} samples A array of 16-bit PCM samples.
 * @return {!Uint8Array}
 */
function encode$2(samples) {
  /** @type {!Uint8Array} */
  let muLawSamples = new Uint8Array(samples.length);
  for (let i=0; i<samples.length; i++) {
    muLawSamples[i] = encodeSample$1(samples[i]);
  }
  return muLawSamples;
}

/**
 * Decode 8-bit mu-Law samples into 16-bit PCM samples.
 * @param {!Uint8Array} samples A array of 8-bit mu-Law samples.
 * @return {!Int16Array}
 */
function decode$2(samples) {
  /** @type {!Int16Array} */
  let pcmSamples = new Int16Array(samples.length);
  for (let i=0; i<samples.length; i++) {
    pcmSamples[i] = decodeSample$1(samples[i]);
  }
  return pcmSamples;
}

/*
 * alawmulaw: A-Law and mu-Law codecs in JavaScript.
 * https://github.com/rochars/alawmulaw
 *
 * Copyright (c) 2018 Rafael da Silva Rocha.
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

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2017 Brett Zamir, 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

const encode$3 = function (arraybuffer, byteOffset, length) {
    const bytes = new Uint8Array(arraybuffer, byteOffset, length),
        len = bytes.length;
    let base64 = '';

    for (let i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
};

const decode$3 = function (base64) {
    const len = base64.length;

    let bufferLength = base64.length * 0.75;
    let p = 0;
    let encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (let i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
};

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * @fileoverview A function to swap endianness in byte buffers.
 * @see https://github.com/rochars/endianness
 */

/** @module endianness */

/**
 * Swap the byte ordering in a buffer. The buffer is modified in place.
 * @param {!Array|!Uint8Array} bytes The bytes.
 * @param {number} offset The byte offset.
 * @param {number=} start The start index. Assumes 0.
 * @param {number=} end The end index. Assumes the buffer length.
 * @throws {Error} If the buffer length is not valid.
 */
function endianness(bytes, offset, start=0, end=bytes.length) {
  if (end % offset) {
    throw new Error("Bad buffer length.");
  }
  for (let index = start; index < end; index += offset) {
    swap(bytes, offset, index);
  }
}

/**
 * Swap the byte order of a value in a buffer. The buffer is modified in place.
 * @param {!Array|!Uint8Array} bytes The bytes.
 * @param {number} offset The byte offset.
 * @param {number} index The start index.
 * @private
 */
function swap(bytes, offset, index) {
  offset--;
  for(let x = 0; x < offset; x++) {
    /** @type {*} */
    let theByte = bytes[index + x];
    bytes[index + x] = bytes[index + offset];
    bytes[index + offset] = theByte;
    offset--;
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview The utf8-buffer-size API.
 * @see https://github.com/rochars/utf8-buffer-size
 */

/** @module utf8BufferSize */

/**
 * Returns how many bytes are needed to serialize a UTF-8 string.
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 * @param {string} str The string to pack.
 * @return {number} The number of bytes needed to serialize the string.
 */
function utf8BufferSize(str) {
  /** @type {number} */
  let bytes = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    /** @type {number} */
    let codePoint = str.codePointAt(i);
    if (codePoint < 128) {
      bytes++;
    } else {
      if (codePoint <= 2047) {
        bytes++;
      } else if(codePoint <= 65535) {
        bytes+=2;
      } else if(codePoint <= 1114111) {
        i++;
        bytes+=3;
      }
      bytes++;
    }
  }
  return bytes;
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview Functions to serialize and deserialize UTF-8 strings.
 * @see https://github.com/rochars/utf8-buffer
 * @see https://encoding.spec.whatwg.org/#the-encoding
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 */

/** @module utf8-buffer */

/**
 * Read a string of UTF-8 characters from a byte buffer.
 * Invalid characters are replaced with 'REPLACEMENT CHARACTER' (U+FFFD).
 * @see https://encoding.spec.whatwg.org/#the-encoding
 * @see https://stackoverflow.com/a/34926911
 * @param {!Uint8Array|!Array<number>} buffer A byte buffer.
 * @param {number=} start The buffer index to start reading.
 * @param {?number=} end The buffer index to stop reading.
 *    If end is null will read until the end of the buffer.
 * @return {string}
 */
function unpack(buffer, start=0, end=null) {
  end = end !== null ? end + 1 : buffer.length;
  /** @type {string} */
  let str = "";
  for(let index = start; index < end;) {
    /** @type {number} */
    let lowerBoundary = 0x80;
    /** @type {number} */
    let upperBoundary = 0xBF;
    /** @type {boolean} */
    let replace = false;
    /** @type {number} */
    let charCode = buffer[index++];
    if (charCode >= 0x00 && charCode <= 0x7F) {
      str += String.fromCharCode(charCode);
    } else {
      /** @type {number} */
      let count = 0;
      if (charCode >= 0xC2 && charCode <= 0xDF) {
        count = 1;
      } else if (charCode >= 0xE0 && charCode <= 0xEF ) {
        count = 2;
        if (buffer[index] === 0xE0) {
          lowerBoundary = 0xA0;
        }
        if (buffer[index] === 0xED) {
          upperBoundary = 0x9F;
        }
      } else if (charCode >= 0xF0 && charCode <= 0xF4 ) {
        count = 3;
        if (buffer[index] === 0xF0) {
          lowerBoundary = 0x90;
        }
        if (buffer[index] === 0xF4) {
          upperBoundary = 0x8F;
        }
      } else {
        replace = true;
      }
      charCode = charCode & (1 << (8 - count - 1)) - 1;
      for (let i = 0; i < count; i++) {
        if (buffer[index] < lowerBoundary || buffer[index] > upperBoundary) {
          replace = true;
        }
        charCode = (charCode << 6) | (buffer[index] & 0x3f);
        index++;
      }
      if (replace) {
        str += String.fromCharCode(0xFFFD);
      } 
      else if (charCode <= 0xffff) {
        str += String.fromCharCode(charCode);
      } else {
        charCode -= 0x10000;
        str += String.fromCharCode(
          ((charCode >> 10) & 0x3ff) + 0xd800,
          (charCode & 0x3ff) + 0xdc00);
      }
    }
  }
  return str;
}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 * @param {string} str The string to pack.
 * @param {!Uint8Array|!Array<number>} buffer The buffer to pack the string to.
 * @param {number=} index The buffer index to start writing.
 * @return {number} The next index to write in the buffer.
 */
function pack(str, buffer, index=0) {
  for (let i = 0, len = str.length; i < len; i++) {
    /** @type {number} */
    let codePoint = str.codePointAt(i);
    if (codePoint < 128) {
      buffer[index] = codePoint;
      index++;
    } else {
      /** @type {number} */
      let count = 0;
      /** @type {number} */
      let offset = 0;
      if (codePoint <= 0x07FF) {
        count = 1;
        offset = 0xC0;
      } else if(codePoint <= 0xFFFF) {
        count = 2;
        offset = 0xE0;
      } else if(codePoint <= 0x10FFFF) {
        count = 3;
        offset = 0xF0;
        i++;
      }
      buffer[index] = (codePoint >> (6 * count)) + offset;
      index++;
      while (count > 0) {
        buffer[index] = 0x80 | (codePoint >> (6 * (count - 1)) & 0x3F);
        index++;
        count--;
      }
    }
  }
  return index;
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview Pack and unpack unsigned ints.
 * @see https://github.com/rochars/uint-buffer
 */

/**
 * @module UintBuffer
 * @ignore
 */

/**
 * A class to write and read unsigned ints to and from byte buffers.
 */
class UintBuffer {
  
  /**
   * @param {number} bits The number of bits used by the integer.
   */
  constructor(bits) {
    /**
     * The number of bits used by one number.
     * @type {number}
     */
    this.bits = bits;
    /**
     * The number of bytes used by one number.
     * @type {number}
     */
    this.bytes = bits < 8 ? 1 : Math.ceil(bits / 8);
    /**
     * @type {number}
     * @protected
     */
    this.max = Math.pow(2, bits) - 1;
    /**
     * @type {number}
     * @protected
     */
    this.min = 0;
    /** @type {number} */
    let r = 8 - ((((bits - 1) | 7) + 1) - bits);
    /**
     * @type {number}
     * @private
     */
    this.lastByteMask_ = Math.pow(2, r > 0 ? r : 8) - 1;
  }

  /**
   * Write one unsigned integer to a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number} num The number.
   * @param {number=} index The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @throws {Error} If num is NaN.
   * @throws {Error} On overflow.
   */
  pack(buffer, num, index=0) {
    if (num !== num) {
      throw new Error('NaN');
    }
    this.overflow(num);
    buffer[index] = (num < 0 ? num + Math.pow(2, this.bits) : num) & 255;
    index++;
    /** @type {number} */
    let len = this.bytes;
    for (let i = 2; i < len; i++) {
      buffer[index] = Math.floor(num / Math.pow(2, ((i - 1) * 8))) & 255;
      index++;
    }
    if (this.bits > 8) {
      buffer[index] = Math.floor(
          num / Math.pow(2, ((this.bytes - 1) * 8))) & this.lastByteMask_;
      index++;
    }
    return index;
  }
  
  /**
   * Read one unsigned integer from a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number=} index The index to read.
   * @return {number} The number.
   * @throws {Error} On overflow.
   */
  unpack(buffer, index=0) {
    /** @type {number} */
    let num = this.unpackUnsafe(buffer, index);
    this.overflow(num);
    return num; 
  }

  /**
   * Read one unsigned integer from a byte buffer.
   * Does not check for overflows.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number} index The index to read.
   * @return {number}
   * @protected
   */
  unpackUnsafe(buffer, index) {
    /** @type {number} */
    let num = 0;
    for(let x = 0; x < this.bytes; x++) {
      num += buffer[index + x] * Math.pow(256, x);
    }
    return num;
  }

  /**
   * Throws error in case of overflow.
   * @param {number} num The number.
   * @throws {Error} on overflow.
   * @protected
   */
  overflow(num) {
    if (num > this.max || num < this.min) {
      throw new Error('Overflow');
    }
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * A class to write and read two's complement signed integers
 * to and from byte buffers.
 * @extends UintBuffer
 */
class TwosComplementBuffer extends UintBuffer {
  
  /**
   * @param {number} bits The number of bits used by the integer.
   */
  constructor(bits) {
    super(bits);
    /**
     * @type {number}
     * @protected
     */
    this.max = Math.pow(2, this.bits) / 2 - 1;
    /**
     * @type {number}
     * @protected
     */
    this.min = -this.max - 1;
  }

  /**
   * Write one two's complement signed integer to a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number} num The number.
   * @param {number=} index The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @throws {Error} If num is NaN.
   * @throws {Error} On overflow.
   */
  pack(buffer, num, index=0) {
    return super.pack(buffer, num, index);
  }

  /**
   * Read one two's complement signed integer from a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number=} index The index to read.
   * @return {number}
   * @throws {Error} On overflow.
   */
  unpack(buffer, index=0) {
    /** @type {number} */
    let num = super.unpackUnsafe(buffer, index);
    num = this.sign_(num);
    this.overflow(num);
    return num; 
  }

  /**
   * Sign a number.
   * @param {number} num The number.
   * @return {number}
   * @private
   */
  sign_(num) {
    if (num > this.max) {
      num -= (this.max * 2) + 2;
    }
    return num;
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * A class to write and read two's complement ints and unsigned ints
 * to and from byte buffers.
 */
class IntBuffer {
  
  /**
   * @param {number} bits The number of bits used by the integer.
   * @param {boolean} signed True if the integer is signed.
   */
  constructor(bits, signed) {
    /** @type {TwosComplementBuffer|UintBuffer} */
    this.parser = signed ?
      new TwosComplementBuffer(bits) : new UintBuffer(bits);
  }

  /**
   * Write one unsigned integer to a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number} num The number.
   * @param {number=} index The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @throws {Error} If num is NaN.
   * @throws {Error} On overflow.
   */
  pack(buffer, num, index=0) {
    return this.parser.pack(buffer, num, index);
  }

  /**
   * Read one unsigned integer from a byte buffer.
   * @param {!Uint8Array|!Array<number>} buffer An array of bytes.
   * @param {number=} index The index to read.
   * @return {number} The number.
   * @throws {Error} On overflow.
   */
  unpack(buffer, index=0) {
    return this.parser.unpack(buffer, index);
  }
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * @fileoverview Functions to validate input.
 * @see https://github.com/rochars/byte-data
 */

const typeDefinition = 'Unsupported type';

/**
 * Validate that the value is not null or undefined.
 * @param {number} value The value.
 * @throws {Error} If the value is not null, Number or Boolean.
 */
function validateValueType(value) {
  if (value === undefined) {
    throw new Error('Undefined value');
  }
  if (value !== null) {
      if (value.constructor != Number && value.constructor != Boolean) {
      throw new Error(
        'Can\'t pack ' + value.constructor);
    }
  }
}

/**
 * Validate the type definition.
 * @param {!Object} theType The type definition.
 * @throws {Error} If the type definition is not valid.
 */
function validateType(theType) {
  if (!theType) {
    throw new Error(typeDefinition);
  }
  if (theType.float) {
    validateFloatType_(theType);
  } else {
    validateIntType_(theType);
  }
}

/**
 * Validate the type definition of floating point numbers.
 * @param {!Object} theType The type definition.
 * @throws {Error} If the type definition is not valid.
 * @private
 */
function validateFloatType_(theType) {
  if (theType.bits != 16 && theType.bits != 32 && theType.bits != 64) {
    throw new Error(typeDefinition);
  }
}

/**
 * Validate the type definition of integers.
 * @param {!Object} theType The type definition.
 * @throws {Error} If the type definition is not valid.
 * @private
 */
function validateIntType_(theType) {
  if (theType.bits < 1 || theType.bits > 53) {
    throw new Error(typeDefinition);
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
 * Copyright (c) 2013 DeNA Co., Ltd.
 * Copyright (c) 2010, Linden Research, Inc
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
 * @fileoverview Functions to pack and unpack IEEE 754 floating point numbers.
 * @see https://github.com/rochars/ieee754-buffer
 */

/** @module ieee754Buffer */

/**
 * Pack a IEEE 754 floating point number.
 * Derived from typedarray.js by Linden Research, MIT License.
 * @see https://bitbucket.org/lindenlab/llsd/raw/7d2646cd3f9b4c806e73aebc4b32bd81e4047fdc/js/typedarray.js
 * @param {!Uint8Array|!Array<number>} buffer The buffer.
 * @param {number} index The index to write on the buffer.
 * @param {number} num The number.
 * @param {number} ebits The number of bits of the exponent.
 * @param {number} fbits The number of bits of the fraction.
 * @return {number} The next index to write on the buffer.
 */
function pack$1(buffer, index, num, ebits, fbits) {
  /** @type {number} */
  let bias = (1 << (ebits - 1)) - 1;
  // Round overflows
  if (Math.abs(num) > Math.pow(2, bias + 1) - ((ebits + fbits) * 2)) {
    num = num < 0 ? -Infinity : Infinity;
  }
  /**
   * sign, need this to handle negative zero
   * @see http://cwestblog.com/2014/02/25/javascript-testing-for-negative-zero/
   * @type {number}
   */
  let sign = (((num = +num) || 1 / num) < 0) ? 1 : num < 0 ? 1 : 0;
  num = Math.abs(num);
  /** @type {number} */
  let exp = Math.min(Math.floor(Math.log(num) / Math.LN2), 1023);
  /** @type {number} */
  let fraction = roundToEven(num / Math.pow(2, exp) * Math.pow(2, fbits));
  // NaN
  if (num !== num) {
    fraction = Math.pow(2, fbits - 1);
    exp = (1 << ebits) - 1;
  // Number
  } else if (num !== 0) {
    if (num >= Math.pow(2, 1 - bias)) {
      if (fraction / Math.pow(2, fbits) >= 2) {
        exp = exp + 1;
        fraction = 1;
      }
      // Overflow
      if (exp > bias) {
        exp = (1 << ebits) - 1;
        fraction = 0;
      } else {
        exp = exp + bias;
        fraction = roundToEven(fraction) - Math.pow(2, fbits);
      }
    } else {
      fraction = roundToEven(num / Math.pow(2, 1 - bias - fbits));
      exp = 0;
    } 
  }
  return packFloatBits_(buffer, index, ebits, fbits, sign, exp, fraction);
}

/**
 * Unpack a IEEE 754 floating point number.
 * Derived from IEEE754 by DeNA Co., Ltd., MIT License. 
 * Adapted to handle NaN. Should port the solution to the original repo.
 * @see https://github.com/kazuho/ieee754.js/blob/master/ieee754.js
 * @param {!Uint8Array|!Array<number>} buffer The buffer.
 * @param {number} index The index to read from the buffer.
 * @param {number} ebits The number of bits of the exponent.
 * @param {number} fbits The number of bits of the fraction.
 * @return {number} The floating point number.
 */
function unpack$1(buffer, index, ebits, fbits) {
  let exponentBias = (1 << (ebits - 1)) - 1;
  let numBytes = Math.ceil((ebits + fbits) / 8);
  /** @type {number} */
  let eMax = (1 << ebits) - 1;
  /** @type {number} */
  let bias = Math.pow(2, -(8 * numBytes - 1 - ebits));
  /** @type {number} */
  let significand;
  /** @type {string} */
  let leftBits = "";
  for (let i = numBytes - 1; i >= 0 ; i--) {
    /** @type {string} */
    let t = buffer[i + index].toString(2);
    leftBits += "00000000".substring(t.length) + t;
  }
  /** @type {number} */
  let sign = leftBits.charAt(0) == "1" ? -1 : 1;
  leftBits = leftBits.substring(1);
  /** @type {number} */
  let exponent = parseInt(leftBits.substring(0, ebits), 2);
  leftBits = leftBits.substring(ebits);
  if (exponent == eMax) {
    if (parseInt(leftBits, 2) !== 0) {
      return NaN;
    }
    return sign * Infinity;  
  } else if (exponent === 0) {
    exponent += 1;
    significand = parseInt(leftBits, 2);
  } else {
    significand = parseInt("1" + leftBits, 2);
  }
  return sign * significand * bias * Math.pow(2, exponent - exponentBias);
}

/**
 * Pack a IEEE754 from its sign, exponent and fraction bits
 * and place it in a byte buffer.
 * @param {!Uint8Array|!Array<number>} buffer The byte buffer to write to.
 * @param {number} index The buffer index to write.
 * @param {number} ebits The number of bits of the exponent.
 * @param {number} fbits The number of bits of the fraction.
 * @param {number} sign The sign.
 * @param {number} exp the exponent.
 * @param {number} fraction The fraction.
 * @return {number}
 * @private
 */
function packFloatBits_(buffer, index, ebits, fbits, sign, exp, fraction) {
  /** @type {!Array<number>} */
  let bits = [];
  // the sign
  bits.push(sign);
  // the exponent
  for (let i = ebits; i > 0; i -= 1) {
    bits[i] = (exp % 2 ? 1 : 0);
    exp = Math.floor(exp / 2);
  }
  // the fraction
  let len = bits.length;
  for (let i = fbits; i > 0; i -= 1) {
    bits[len + i] = (fraction % 2 ? 1 : 0);
    fraction = Math.floor(fraction / 2);
  }
  // pack as bytes
  /** @type {string} */
  let str = bits.join('');
  /** @type {number} */
  let numBytes = Math.floor((ebits + fbits + 1) / 8) + index - 1;
  /** @type {number} */
  let k = index;
  while (numBytes >= index) {
    buffer[numBytes] = parseInt(str.substring(0, 8), 2);
    str = str.substring(8);
    numBytes--;
    k++;
  }
  return k;
}

function roundToEven(n) {
  var w = Math.floor(n), f = n - w;
  if (f < 0.5) {
    return w;
  }
  if (f > 0.5) {
    return w + 1;
  }
  return w % 2 ? w + 1 : w;
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * A class to pack and unpack integers and floating-point numbers.
 * Signed integers are two's complement.
 * Floating point are IEEE 754 standard.
 * @extends {IntBuffer}
 */
class NumberBuffer extends IntBuffer {
  
  constructor(theType) {
    validateType(theType);
    theType.signed = theType.float ? false : theType.signed;
    super(theType.bits, theType.signed);
    this.offset = this.parser.bytes;
    this.parser.bytes = this.parser.bits === 64 ? 4 : this.parser.bytes;
    this.setReaderAndWriter_(theType);
  }

  /**
   * Read 1 16-bit float from bytes.
   * @see https://stackoverflow.com/a/8796597
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number=} i The index to read.
   * @return {number}
   * @private
   */
  read16F_(bytes, i=0) {
    return unpack$1(bytes, i, 5, 11);
  }

  /**
   * Read 1 32-bit float from bytes using a TypedArray.
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number=} i The index to read.
   * @return {number}
   * @private
   */
  read32F_(bytes, i=0) {
    return unpack$1(bytes, i, 8, 23);
  }

  /**
   * Read 1 64-bit float from bytes using a TypedArray.
   * Thanks https://gist.github.com/kg/2192799
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number=} i The index to read.
   * @return {number}
   * @private
   */
  read64F_(bytes, i=0) {
    return unpack$1(bytes, i, 11, 52);
  }

  /**
   * Write one 16-bit float as a binary value.
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number} num The number to write as bytes.
   * @param {number=} j The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @private
   */
  write16F_(bytes, num, j=0) {
    return pack$1(bytes, j, num, 5, 11);
  }

  /**
   * Write one 32-bit float as a binary value using a TypedArray.
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number} num The number to write as bytes.
   * @param {number=} j The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @private
   */
  write32F_(bytes, num, j=0) {
      return pack$1(bytes, j, num, 8, 23);
  }

  /**
   * Write one 64-bit float as a binary value using a TypedArray.
   * @param {!Uint8Array|!Array<number>} bytes An array of bytes.
   * @param {number} num The number to write as bytes.
   * @param {number=} j The index being written in the byte buffer.
   * @return {number} The next index to write on the byte buffer.
   * @private
   */
  write64F_(bytes, num, j=0) {
      return pack$1(bytes, j, num, 11, 52);
  }

  /**
   * Set the functions to pack and unpack numbers.
   * @param {!Object} theType The type definition.
   * @private
   */
  setReaderAndWriter_(theType) {
    if (theType.float) {
      if (theType.bits == 16) {
        this.unpack = this.read16F_;
        this.pack = this.write16F_;
      } else if(theType.bits == 32) {
        this.unpack = this.read32F_;
        this.pack = this.write32F_;
      } else {
        this.unpack = this.read64F_;
        this.pack = this.write64F_;
      }
    } else {
      this.unpack = super.unpack;
      this.pack = super.pack;
    }
  }
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * Read a string of UTF-8 characters from a byte buffer.
 * @param {!Uint8Array|!Array<number>} buffer A byte buffer.
 * @param {number=} index The buffer index to start reading.
 * @param {?number=} end The buffer index to stop reading.
 *   If end is null will read until the end of the buffer.
 * @return {string}
 */
function unpackString(buffer, index=0, end=null) {
  return unpack(buffer, index, end);
}

/**
 * Write a string of UTF-8 characters as a byte buffer.
 * @param {string} str The string to pack.
 * @return {!Uint8Array} The buffer with the packed string written.
 */ 
function packString(str) {
  /** @type {!Uint8Array} */
  let buffer = new Uint8Array(utf8BufferSize(str));
  pack(str, buffer, 0);
  return buffer;
}

/**
 * Write a string of UTF-8 characters to a byte buffer.
 * @param {string} str The string to pack.
 * @param {!Uint8Array|!Array<number>} buffer The output buffer.
 * @param {number=} index The buffer index to start writing.
 *   Assumes zero if undefined.
 * @return {number} The next index to write in the buffer.
 */
function packStringTo(str, buffer, index=0) {
  return pack(str, buffer, index);
}

// Numbers
/**
 * Pack a number as a byte buffer.
 * @param {number} value The number.
 * @param {!Object} theType The type definition.
 * @return {!Array<number>} The packed value.
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} If the value is not valid.
 */
function pack$2(value, theType) {
  /** @type {!Array<number>} */
  let output = [];
  packTo(value, theType, output);
  return output;
}

/**
 * Pack a number to a byte buffer.
 * @param {number} value The value.
 * @param {!Object} theType The type definition.
 * @param {!Uint8Array|!Array<number>} buffer The output buffer.
 * @param {number=} index The buffer index to write. Assumes 0 if undefined.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} If the value is not valid.
 */
function packTo(value, theType, buffer, index=0) {
  return packArrayTo([value], theType, buffer, index);
}

/**
 * Pack a array of numbers to a byte buffer.
 * @param {!Array<number>|!TypedArray} values The value.
 * @param {!Object} theType The type definition.
 * @param {!Uint8Array|!Array<number>} buffer The output buffer.
 * @param {number=} index The buffer index to start writing.
 *   Assumes zero if undefined.
 * @return {number} The next index to write.
 * @throws {Error} If the type definition is not valid.
 * @throws {Error} If the value is not valid.
 */
function packArrayTo(values, theType, buffer, index=0) {
  /** @type {NumberBuffer} */
  let packer = new NumberBuffer(theType);
  let valuesLen = values.length;
  for (let i = 0; i < valuesLen; i++) {
    validateValueType(values[i]);
    /** @type {number} */
    let len = index + packer.offset;
    while (index < len) {
      index = packer.pack(buffer, values[i], index);
    }
    if (theType.be) {
      endianness(
        buffer, packer.offset, index - packer.offset, index);
    }
  }
  return index;
}

/**
 * Unpack a number from a byte buffer.
 * @param {!Uint8Array|!Array<number>} buffer The byte buffer.
 * @param {!Object} theType The type definition.
 * @param {number=} index The buffer index to read. Assumes zero if undefined.
 * @return {number}
 * @throws {Error} If the type definition is not valid
 * @throws {Error} On bad buffer length.
 */
function unpack$2(buffer, theType, index=0) {
  /** @type {NumberBuffer} */
  let packer = new NumberBuffer(theType);
  if ((packer.offset + index) > buffer.length) {
    throw Error('Bad buffer length');
  }
  if (theType.be) {
    endianness(buffer, packer.offset, index, index + packer.offset);
  }
  /** @type {number} */
  let value = packer.unpack(buffer, index);
  if (theType.be) {
    endianness(buffer, packer.offset, index, index + packer.offset);
  }
  return value;
}

/**
 * Unpack an array of numbers from a byte buffer.
 * @param {!Uint8Array|!Array<number>} buffer The byte buffer.
 * @param {!Object} theType The type definition.
 * @param {number=} index The buffer index to start reading.
 *   Assumes zero if undefined.
 * @param {number=} end The buffer index to stop reading.
 *   Assumes the buffer length if undefined.
 * @return {!Array<number>}
 * @throws {Error} If the type definition is not valid
 */
function unpackArray(buffer, theType, index=0, end=buffer.length) {
  /** @type {!Array<number>} */
  let output = [];
  unpackArrayTo(buffer, theType, output, index, end);
  return output;
}

/**
 * Unpack a array of numbers to a typed array.
 * @param {!Uint8Array|!Array<number>} buffer The byte buffer.
 * @param {!Object} theType The type definition.
 * @param {!TypedArray|!Array<number>} output The output array.
 * @param {number=} index The buffer index to start reading.
 *   Assumes zero if undefined.
 * @param {number=} end The buffer index to stop reading.
 *   Assumes the buffer length if undefined.
 * @throws {Error} If the type definition is not valid
 */
function unpackArrayTo(
    buffer, theType, output, index=0, end=buffer.length) {
  /** @type {NumberBuffer} */
  let packer = new NumberBuffer(theType);
  /** @type {number} */
  let originalIndex = index;
  while ((end - index) % packer.offset) {
      end--;
  }
  if (theType.be) {
    endianness(buffer, packer.offset, index, end);
  }
  for (let i = 0; index < end; index += packer.offset) {
    output[i] = packer.unpack(buffer, index);
    i++;
  }
  if (theType.be) {
    endianness(buffer, packer.offset, originalIndex, end);
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * @fileoverview The code for different formats of WAVE audio.
 * @see https://github.com/rochars/wavefile
 */

/**
 * Audio formats.
 * Formats not listed here should be set to 65534,
 * the code for WAVE_FORMAT_EXTENSIBLE
 * @enum {number}
 * @private
 */
var WAV_AUDIO_FORMATS = {
  '4': 17,
  '8': 1,
  '8a': 6,
  '8m': 7,
  '16': 1,
  '24': 1,
  '32': 1,
  '32f': 3,
  '64': 3
};

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * Return the header for a wav file.
 * @param {string} bitDepthCode The audio bit depth
 * @param {number} numChannels The number of channels
 * @param {number} sampleRate The sample rate.
 * @param {number} numBytes The number of bytes each sample use.
 * @param {number} samplesLength The length of the samples in bytes.
 * @param {!Object} options The extra options, like container defintion.
 * @private
 */
function makeWavHeader(
  bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
  let header = {};
  if (bitDepthCode == '4') {
    header = createADPCMHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

  } else if (bitDepthCode == '8a' || bitDepthCode == '8m') {
    header = createALawMulawHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

  } else if(Object.keys(WAV_AUDIO_FORMATS).indexOf(bitDepthCode) == -1 ||
      numChannels > 2) {
    header = createExtensibleHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);

  } else {
    header = createPCMHeader_(
      bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);      
  }
  return header;
}

/**
 * Create the header of a linear PCM wave file.
 * @param {string} bitDepthCode The audio bit depth
 * @param {number} numChannels The number of channels
 * @param {number} sampleRate The sample rate.
 * @param {number} numBytes The number of bytes each sample use.
 * @param {number} samplesLength The length of the samples in bytes.
 * @param {!Object} options The extra options, like container defintion.
 * @private
 */
function createPCMHeader_(
  bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
  return {
    container: options.container,
    chunkSize: 36 + samplesLength,
    format: 'WAVE',
    bitDepth: bitDepthCode,
    fmt: {
      chunkId: 'fmt ',
      chunkSize: 16,
      audioFormat: WAV_AUDIO_FORMATS[bitDepthCode] || 65534,
      numChannels: numChannels,
      sampleRate: sampleRate,
      byteRate: (numChannels * numBytes) * sampleRate,
      blockAlign: numChannels * numBytes,
      bitsPerSample: parseInt(bitDepthCode, 10),
      cbSize: 0,
      validBitsPerSample: 0,
      dwChannelMask: 0,
      subformat: []
    }
  };
}

/**
 * Create the header of a ADPCM wave file.
 * @param {string} bitDepthCode The audio bit depth
 * @param {number} numChannels The number of channels
 * @param {number} sampleRate The sample rate.
 * @param {number} numBytes The number of bytes each sample use.
 * @param {number} samplesLength The length of the samples in bytes.
 * @param {!Object} options The extra options, like container defintion.
 * @private
 */
function createADPCMHeader_(
  bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
  let header = createPCMHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
  header.chunkSize = 40 + samplesLength;
  header.fmt.chunkSize = 20;
  header.fmt.byteRate = 4055;
  header.fmt.blockAlign = 256;
  header.fmt.bitsPerSample = 4;
  header.fmt.cbSize = 2;
  header.fmt.validBitsPerSample = 505;
  header.fact = {
    chunkId: 'fact',
    chunkSize: 4,
    dwSampleLength: samplesLength * 2
  };
  return header;
}

/**
 * Create the header of WAVE_FORMAT_EXTENSIBLE file.
 * @param {string} bitDepthCode The audio bit depth
 * @param {number} numChannels The number of channels
 * @param {number} sampleRate The sample rate.
 * @param {number} numBytes The number of bytes each sample use.
 * @param {number} samplesLength The length of the samples in bytes.
 * @param {!Object} options The extra options, like container defintion.
 * @private
 */
function createExtensibleHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
  let header = createPCMHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
  header.chunkSize = 36 + 24 + samplesLength;
  header.fmt.chunkSize = 40;
  header.fmt.bitsPerSample = ((parseInt(bitDepthCode, 10) - 1) | 7) + 1;
  header.fmt.cbSize = 22;
  header.fmt.validBitsPerSample = parseInt(bitDepthCode, 10);
  header.fmt.dwChannelMask = getDwChannelMask_(numChannels);
  // subformat 128-bit GUID as 4 32-bit values
  // only supports uncompressed integer PCM samples
  header.fmt.subformat = [1, 1048576, 2852126848, 1905997824];
  return header;
}

/**
 * Create the header of mu-Law and A-Law wave files.
 * @param {string} bitDepthCode The audio bit depth
 * @param {number} numChannels The number of channels
 * @param {number} sampleRate The sample rate.
 * @param {number} numBytes The number of bytes each sample use.
 * @param {number} samplesLength The length of the samples in bytes.
 * @param {!Object} options The extra options, like container defintion.
 * @private
 */
function createALawMulawHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options) {
  let header = createPCMHeader_(
    bitDepthCode, numChannels, sampleRate, numBytes, samplesLength, options);
  header.chunkSize = 40 + samplesLength;
  header.fmt.chunkSize = 20;
  header.fmt.cbSize = 2;
  header.fmt.validBitsPerSample = 8;
  header.fact = {
    chunkId: 'fact',
    chunkSize: 4,
    dwSampleLength: samplesLength
  };
  return header;
}

/**
 * Get the value for dwChannelMask according to the number of channels.
 * @return {number} the dwChannelMask value.
 * @private
 */
function getDwChannelMask_(numChannels) {
  /** @type {number} */
  let dwChannelMask = 0;
  // mono = FC
  if (numChannels === 1) {
    dwChannelMask = 0x4;
  // stereo = FL, FR
  } else if (numChannels === 2) {
    dwChannelMask = 0x3;
  // quad = FL, FR, BL, BR
  } else if (numChannels === 4) {
    dwChannelMask = 0x33;
  // 5.1 = FL, FR, FC, LF, BL, BR
  } else if (numChannels === 6) {
    dwChannelMask = 0x3F;
  // 7.1 = FL, FR, FC, LF, BL, BR, SL, SR
  } else if (numChannels === 8) {
    dwChannelMask = 0x63F;
  }
  return dwChannelMask;
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * Validate the header of the file.
 * @throws {Error} If any property of the object appears invalid.
 * @private
 */
function validateWavHeader_(header) {
  validateBitDepth_$1(header);
  validateNumChannels_(header);
  validateSampleRate_(header);
}

/**
 * Validate the bit depth.
 * @return {boolean} True is the bit depth is valid.
 * @throws {Error} If bit depth is invalid.
 * @private
 */
function validateBitDepth_$1(header) {
  if (!WAV_AUDIO_FORMATS[header.bitDepth]) {
    if (parseInt(header.bitDepth, 10) > 8 &&
        parseInt(header.bitDepth, 10) < 54) {
      return true;
    }
    throw new Error('Invalid bit depth.');
  }
  return true;
}

/**
 * Validate the number of channels.
 * @return {boolean} True is the number of channels is valid.
 * @throws {Error} If the number of channels is invalid.
 * @private
 */
function validateNumChannels_(header) {
  /** @type {number} */
  let blockAlign = header.fmt.numChannels * header.fmt.bitsPerSample / 8;
  if (header.fmt.numChannels < 1 || blockAlign > 65535) {
    throw new Error('Invalid number of channels.');
  }
  return true;
}

/**
 * Validate the sample rate value.
 * @return {boolean} True is the sample rate is valid.
 * @throws {Error} If the sample rate is invalid.
 * @private
 */
function validateSampleRate_(header) {
  /** @type {number} */
  let byteRate = header.fmt.numChannels *
    (header.fmt.bitsPerSample / 8) * header.fmt.sampleRate;
  if (header.fmt.sampleRate < 1 || byteRate > 4294967295) {
    throw new Error('Invalid sample rate.');
  }
  return true;
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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
 * A class to read and write to buffers.
 */
class BufferIO {
	
  constructor() {
  	/**
     * @type {number}
     * @private
     */
    this.head_ = 0;
  }

  /**
   * Write a variable size string as bytes. If the string is smaller
   * than the max size the output array is filled with 0s.
   * @param {string} str The string to be written as bytes.
   * @param {number} maxSize the max size of the string.
   * @return {!Array<number>} The bytes.
   * @private
   */
  writeString_(str, maxSize, push=true) {
    /** @type {!Array<number>} */   
    let bytes = Array.prototype.slice.call(packString(str));
    if (push) {
      for (let i=bytes.length; i<maxSize; i++) {
        bytes.push(0);
      }  
    }
    return bytes;
  }

  /**
   * Read bytes as a ZSTR string.
   * @param {!Uint8Array} bytes The bytes.
   * @return {string} The string.
   * @private
   */
  readZSTR_(bytes, index=0) {
    /** @type {string} */
    let str = '';
    for (let i=index; i<bytes.length; i++) {
      this.head_++;
      if (bytes[i] === 0) {
        break;
      }
      str += unpackString(bytes, i, i);
    }
    return str;
  }

  /**
   * Read bytes as a string from a RIFF chunk.
   * @param {!Uint8Array} bytes The bytes.
   * @param {number} maxSize the max size of the string.
   * @return {string} The string.
   * @private
   */
  readString_(bytes, maxSize) {
    /** @type {string} */
    let str = '';
    str = unpackString(bytes, this.head_, this.head_ + maxSize - 1);
    this.head_ += maxSize;
    return str;
  }

  /**
   * Read a number from a chunk.
   * @param {!Uint8Array} bytes The chunk bytes.
   * @param {!Object} bdType The type definition.
   * @return {number} The number.
   * @private
   */
  read_(bytes, bdType) {
    /** @type {number} */
    let size = bdType.bits / 8;
    /** @type {number} */
    let value = unpack$2(bytes, bdType, this.head_);
    this.head_ += size;
    return value;
  }
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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

let io = new BufferIO();

/**
 * Return a .wav file byte buffer with the data from the WaveFile object.
 * The return value of this method can be written straight to disk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Uint8Array} The wav file bytes.
 * @private
 */
function writeWavBuffer(wav) {
  let uInt32_ = {bits: 32, be: false};
  let uInt16_ = {bits: 16, be: false};
  uInt16_.be = wav.container === 'RIFX';
  uInt32_.be = uInt16_.be;
  /** @type {!Array<!Array<number>>} */
  let fileBody = [
    getJunkBytes_(wav, uInt32_),
    getDs64Bytes_(wav, uInt32_),
    getBextBytes_(wav, uInt32_, uInt16_),
    getFmtBytes_(wav, uInt32_, uInt16_),
    getFactBytes_(wav, uInt32_),
    Array.prototype.slice.call(packString(wav.data.chunkId)),
    pack$2(wav.data.samples.length, uInt32_),
    wav.data.samples,
    getCueBytes_(wav, uInt32_),
    getSmplBytes_(wav, uInt32_),
    getLISTBytes_(wav, uInt32_, uInt16_)
  ];
  /** @type {number} */
  let fileBodyLength = 0;
  for (let i=0; i<fileBody.length; i++) {
    fileBodyLength += fileBody[i].length;
  }
  /** @type {!Uint8Array} */
  let file = new Uint8Array(fileBodyLength + 12);
  /** @type {number} */
  let index = 0;
  index = packStringTo(wav.container, file, index);
  index = packTo(fileBodyLength + 4, uInt32_, file, index);
  index = packStringTo(wav.format, file, index);
  for (let i=0; i<fileBody.length; i++) {
    file.set(fileBody[i], index);
    index += fileBody[i].length;
  }
  return file;
}

/**
 * Return the bytes of the 'bext' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'bext' chunk bytes.
 * @private
 */
function getBextBytes_(wav, uInt32_, uInt16_) {
  /** @type {!Array<number>} */
  let bytes = [];
  enforceBext_(wav);
  if (wav.bext.chunkId) {
    wav.bext.chunkSize = 602 + wav.bext.codingHistory.length;
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.bext.chunkId)),
      pack$2(602 + wav.bext.codingHistory.length, uInt32_),
      io.writeString_(wav.bext.description, 256),
      io.writeString_(wav.bext.originator, 32),
      io.writeString_(wav.bext.originatorReference, 32),
      io.writeString_(wav.bext.originationDate, 10),
      io.writeString_(wav.bext.originationTime, 8),
      pack$2(wav.bext.timeReference[0], uInt32_),
      pack$2(wav.bext.timeReference[1], uInt32_),
      pack$2(wav.bext.version, uInt16_),
      Array.prototype.slice.call(io.writeString_(wav.bext.UMID, 64)),
      pack$2(wav.bext.loudnessValue, uInt16_),
      pack$2(wav.bext.loudnessRange, uInt16_),
      pack$2(wav.bext.maxTruePeakLevel, uInt16_),
      pack$2(wav.bext.maxMomentaryLoudness, uInt16_),
      pack$2(wav.bext.maxShortTermLoudness, uInt16_),
      io.writeString_(wav.bext.reserved, 180),
      io.writeString_(
        wav.bext.codingHistory, wav.bext.codingHistory.length));
  }
  return bytes;
}

/**
 * Make sure a 'bext' chunk is created if BWF data was created in a file.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function enforceBext_(wav) {
  for (var prop in wav.bext) {
    if (wav.bext.hasOwnProperty(prop)) {
      if (wav.bext[prop] && prop != 'timeReference') {
        wav.bext.chunkId = 'bext';
        break;
      }
    }
  }
  if (wav.bext.timeReference[0] || wav.bext.timeReference[1]) {
    wav.bext.chunkId = 'bext';
  }
}

/**
 * Return the bytes of the 'ds64' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'ds64' chunk bytes.
 * @private
 */
function getDs64Bytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let bytes = [];
  if (wav.ds64.chunkId) {
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.ds64.chunkId)),
      pack$2(wav.ds64.chunkSize, uInt32_),
      pack$2(wav.ds64.riffSizeHigh, uInt32_),
      pack$2(wav.ds64.riffSizeLow, uInt32_),
      pack$2(wav.ds64.dataSizeHigh, uInt32_),
      pack$2(wav.ds64.dataSizeLow, uInt32_),
      pack$2(wav.ds64.originationTime, uInt32_),
      pack$2(wav.ds64.sampleCountHigh, uInt32_),
      pack$2(wav.ds64.sampleCountLow, uInt32_));
  }
  //if (this.ds64.tableLength) {
  //  ds64Bytes = ds64Bytes.concat(
  //    pack(this.ds64.tableLength, this.uInt32_),
  //    this.ds64.table);
  //}
  return bytes;
}

/**
 * Return the bytes of the 'cue ' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'cue ' chunk bytes.
 * @private
 */
function getCueBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let bytes = [];
  if (wav.cue.chunkId) {
    /** @type {!Array<number>} */
    let cuePointsBytes = getCuePointsBytes_(wav, uInt32_);
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.cue.chunkId)),
      pack$2(cuePointsBytes.length + 4, uInt32_),
      pack$2(wav.cue.dwCuePoints, uInt32_),
      cuePointsBytes);
  }
  return bytes;
}

/**
 * Return the bytes of the 'cue ' points.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'cue ' points as an array of bytes.
 * @private
 */
function getCuePointsBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let points = [];
  for (let i=0; i<wav.cue.dwCuePoints; i++) {
    points = points.concat(
      pack$2(wav.cue.points[i].dwName, uInt32_),
      pack$2(wav.cue.points[i].dwPosition, uInt32_),
      Array.prototype.slice.call(packString(wav.cue.points[i].fccChunk)),
      pack$2(wav.cue.points[i].dwChunkStart, uInt32_),
      pack$2(wav.cue.points[i].dwBlockStart, uInt32_),
      pack$2(wav.cue.points[i].dwSampleOffset, uInt32_));
  }
  return points;
}

/**
 * Return the bytes of the 'smpl' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'smpl' chunk bytes.
 * @private
 */
function getSmplBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let bytes = [];
  if (wav.smpl.chunkId) {
    /** @type {!Array<number>} */
    let smplLoopsBytes = getSmplLoopsBytes_(wav, uInt32_);
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.smpl.chunkId)),
      pack$2(smplLoopsBytes.length + 36, uInt32_),
      pack$2(wav.smpl.dwManufacturer, uInt32_),
      pack$2(wav.smpl.dwProduct, uInt32_),
      pack$2(wav.smpl.dwSamplePeriod, uInt32_),
      pack$2(wav.smpl.dwMIDIUnityNote, uInt32_),
      pack$2(wav.smpl.dwMIDIPitchFraction, uInt32_),
      pack$2(wav.smpl.dwSMPTEFormat, uInt32_),
      pack$2(wav.smpl.dwSMPTEOffset, uInt32_),
      pack$2(wav.smpl.dwNumSampleLoops, uInt32_),
      pack$2(wav.smpl.dwSamplerData, uInt32_),
      smplLoopsBytes);
  }
  return bytes;
}

/**
 * Return the bytes of the 'smpl' loops.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'smpl' loops as an array of bytes.
 * @private
 */
function getSmplLoopsBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let loops = [];
  for (let i=0; i<wav.smpl.dwNumSampleLoops; i++) {
    loops = loops.concat(
      pack$2(wav.smpl.loops[i].dwName, uInt32_),
      pack$2(wav.smpl.loops[i].dwType, uInt32_),
      pack$2(wav.smpl.loops[i].dwStart, uInt32_),
      pack$2(wav.smpl.loops[i].dwEnd, uInt32_),
      pack$2(wav.smpl.loops[i].dwFraction, uInt32_),
      pack$2(wav.smpl.loops[i].dwPlayCount, uInt32_));
  }
  return loops;
}

/**
 * Return the bytes of the 'fact' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'fact' chunk bytes.
 * @private
 */
function getFactBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let bytes = [];
  if (wav.fact.chunkId) {
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.fact.chunkId)),
      pack$2(wav.fact.chunkSize, uInt32_),
      pack$2(wav.fact.dwSampleLength, uInt32_));
  }
  return bytes;
}

/**
 * Return the bytes of the 'fmt ' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'fmt' chunk bytes.
 * @throws {Error} if no 'fmt ' chunk is present.
 * @private
 */
function getFmtBytes_(wav, uInt32_, uInt16_) {
  /** @type {!Array<number>} */
  let fmtBytes = [];
  if (wav.fmt.chunkId) {
    return fmtBytes.concat(
      Array.prototype.slice.call(packString(wav.fmt.chunkId)),
      pack$2(wav.fmt.chunkSize, uInt32_),
      pack$2(wav.fmt.audioFormat, uInt16_),
      pack$2(wav.fmt.numChannels, uInt16_),
      pack$2(wav.fmt.sampleRate, uInt32_),
      pack$2(wav.fmt.byteRate, uInt32_),
      pack$2(wav.fmt.blockAlign, uInt16_),
      pack$2(wav.fmt.bitsPerSample, uInt16_),
      getFmtExtensionBytes_(wav, uInt32_, uInt16_));
  }
  throw Error('Could not find the "fmt " chunk');
}

/**
 * Return the bytes of the fmt extension fields.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The fmt extension bytes.
 * @private
 */
function getFmtExtensionBytes_(wav, uInt32_, uInt16_) {
  /** @type {!Array<number>} */
  let extension = [];
  if (wav.fmt.chunkSize > 16) {
    extension = extension.concat(
      pack$2(wav.fmt.cbSize, uInt16_));
  }
  if (wav.fmt.chunkSize > 18) {
    extension = extension.concat(
      pack$2(wav.fmt.validBitsPerSample, uInt16_));
  }
  if (wav.fmt.chunkSize > 20) {
    extension = extension.concat(
      pack$2(wav.fmt.dwChannelMask, uInt32_));
  }
  if (wav.fmt.chunkSize > 24) {
    extension = extension.concat(
      pack$2(wav.fmt.subformat[0], uInt32_),
      pack$2(wav.fmt.subformat[1], uInt32_),
      pack$2(wav.fmt.subformat[2], uInt32_),
      pack$2(wav.fmt.subformat[3], uInt32_));
  }
  return extension;
}

/**
 * Return the bytes of the 'LIST' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'LIST' chunk bytes.
 */
function getLISTBytes_(wav, uInt32_, uInt16_) {
  /** @type {!Array<number>} */
  let bytes = [];
  for (let i=0; i<wav.LIST.length; i++) {
    /** @type {!Array<number>} */
    let subChunksBytes = getLISTSubChunksBytes_(
        wav.LIST[i].subChunks, wav.LIST[i].format, wav, uInt32_, uInt16_);
    bytes = bytes.concat(
      Array.prototype.slice.call(packString(wav.LIST[i].chunkId)),
      pack$2(subChunksBytes.length + 4, uInt32_),
      Array.prototype.slice.call(packString(wav.LIST[i].format)),
      subChunksBytes);
  }
  return bytes;
}

/**
 * Return the bytes of the sub chunks of a 'LIST' chunk.
 * @param {!Array<!Object>} subChunks The 'LIST' sub chunks.
 * @param {string} format The format of the 'LIST' chunk.
 *    Currently supported values are 'adtl' or 'INFO'.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The sub chunk bytes.
 * @private
 */
function getLISTSubChunksBytes_(subChunks, format, wav, uInt32_, uInt16_) {
  /** @type {!Array<number>} */
  let bytes = [];
  for (let i=0; i<subChunks.length; i++) {
    if (format == 'INFO') {
      bytes = bytes.concat(
        Array.prototype.slice.call(packString(subChunks[i].chunkId)),
        pack$2(subChunks[i].value.length + 1, uInt32_),
        io.writeString_(
          subChunks[i].value, subChunks[i].value.length));
      bytes.push(0);
    } else if (format == 'adtl') {
      if (['labl', 'note'].indexOf(subChunks[i].chunkId) > -1) {
        bytes = bytes.concat(
          Array.prototype.slice.call(packString(subChunks[i].chunkId)),
          pack$2(
            subChunks[i].value.length + 4 + 1, uInt32_),
          pack$2(subChunks[i].dwName, uInt32_),
          io.writeString_(
            subChunks[i].value,
            subChunks[i].value.length));
        bytes.push(0);
      } else if (subChunks[i].chunkId == 'ltxt') {
        bytes = bytes.concat(
          getLtxtChunkBytes_(subChunks[i], wav, uInt32_, uInt16_));
      }
    }
    if (bytes.length % 2) {
      bytes.push(0);
    }
  }
  return bytes;
}

/**
 * Return the bytes of a 'ltxt' chunk.
 * @param {!Object} ltxt the 'ltxt' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'ltxt' chunk bytes.
 * @private
 */
function getLtxtChunkBytes_(ltxt, wav, uInt32_, uInt16_) {
  return [].concat(
    Array.prototype.slice.call(packString(ltxt.chunkId)),
    pack$2(ltxt.value.length + 20, uInt32_),
    pack$2(ltxt.dwName, uInt32_),
    pack$2(ltxt.dwSampleLength, uInt32_),
    pack$2(ltxt.dwPurposeID, uInt32_),
    pack$2(ltxt.dwCountry, uInt16_),
    pack$2(ltxt.dwLanguage, uInt16_),
    pack$2(ltxt.dwDialect, uInt16_),
    pack$2(ltxt.dwCodePage, uInt16_),
    io.writeString_(ltxt.value, ltxt.value.length));
}

/**
 * Return the bytes of the 'junk' chunk.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @return {!Array<number>} The 'junk' chunk bytes.
 * @private
 */
function getJunkBytes_(wav, uInt32_) {
  /** @type {!Array<number>} */
  let bytes = [];
  if (wav.junk.chunkId) {
    return bytes.concat(
      Array.prototype.slice.call(packString(wav.junk.chunkId)),
      pack$2(wav.junk.chunkData.length, uInt32_),
      wav.junk.chunkData);
  }
  return bytes;
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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

/** @private */
const uInt32_ = {bits: 32};
/** @type {number} */
let head_ = 0;

/**
 * Return the chunks in a RIFF/RIFX file.
 * @param {!Uint8Array} buffer The file bytes.
 * @return {!Object} The RIFF chunks.
 */
function riffChunks(buffer) {
    head_ = 0;
    let chunkId = getChunkId_(buffer, 0);
    uInt32_.be = chunkId == 'RIFX';
    let format = unpackString(buffer, 8, 11);
    head_ += 4;
    return {
        chunkId: chunkId,
        chunkSize: getChunkSize_(buffer, 0),
        format: format,
        subChunks: getSubChunksIndex_(buffer)
    };
}

/**
  * Find a chunk by its fourCC_ in a array of RIFF chunks.
  * @param {!Object} chunks The wav file chunks.
  * @param {string} chunkId The chunk fourCC_.
  * @param {boolean} multiple True if there may be multiple chunks
  *    with the same chunkId.
  * @return {?Array<!Object>}
  */
function findChunk(chunks, chunkId, multiple=false) {
  /** @type {!Array<!Object>} */
  let chunk = [];
  for (let i=0; i<chunks.length; i++) {
    if (chunks[i].chunkId == chunkId) {
      if (multiple) {
        chunk.push(chunks[i]);
      } else {
        return chunks[i];
      }
    }
  }
  if (chunkId == 'LIST') {
    return chunk.length ? chunk : null;
  }
  return null;
}

/**
 * Return the sub chunks of a RIFF file.
 * @param {!Uint8Array} buffer the RIFF file bytes.
 * @return {!Array<Object>} The subchunks of a RIFF/RIFX or LIST chunk.
 * @private
 */
function getSubChunksIndex_(buffer) {
    let chunks = [];
    let i = head_;
    while(i <= buffer.length - 8) {
        chunks.push(getSubChunkIndex_(buffer, i));
        i += 8 + chunks[chunks.length - 1].chunkSize;
        i = i % 2 ? i + 1 : i;
    }
    return chunks;
}

/**
 * Return a sub chunk from a RIFF file.
 * @param {!Uint8Array} buffer the RIFF file bytes.
 * @param {number} index The start index of the chunk.
 * @return {!Object} A subchunk of a RIFF/RIFX or LIST chunk.
 * @private
 */
function getSubChunkIndex_(buffer, index) {
    let chunk = {
        chunkId: getChunkId_(buffer, index),
        chunkSize: getChunkSize_(buffer, index),
    };
    if (chunk.chunkId == 'LIST') {
        chunk.format = unpackString(buffer, index + 8, index + 11);
        head_ += 4;
        chunk.subChunks = getSubChunksIndex_(buffer);
    } else {
        let realChunkSize = chunk.chunkSize % 2 ?
            chunk.chunkSize + 1 : chunk.chunkSize;
        head_ = index + 8 + realChunkSize;
        chunk.chunkData = {
            start: index + 8,
            end: head_
        };
    }
    return chunk;
}

/**
 * Return the fourCC_ of a chunk.
 * @param {!Uint8Array} buffer the RIFF file bytes.
 * @param {number} index The start index of the chunk.
 * @return {string} The id of the chunk.
 * @private
 */
function getChunkId_(buffer, index) {
    head_ += 4;
    return unpackString(buffer, index, index + 3);
}

/**
 * Return the size of a chunk.
 * @param {!Uint8Array} buffer the RIFF file bytes.
 * @param {number} index The start index of the chunk.
 * @return {number} The size of the chunk without the id and size fields.
 * @private
 */
function getChunkSize_(buffer, index) {
    head_ += 4;
    return unpack$2(buffer, uInt32_, index + 4);
}

/*
 * Copyright (c) 2018 Rafael da Silva Rocha.
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

let io$1 = new BufferIO();

/**
 * Set up the WaveFile object from a byte buffer.
 * @param {!Uint8Array} buffer The buffer.
 * @param {boolean} samples True if the samples should be loaded.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @throws {Error} If container is not RIFF, RIFX or RF64.
 * @throws {Error} If no 'fmt ' chunk is found.
 * @throws {Error} If no 'data' chunk is found.
 */
function readWavBuffer(buffer, samples, wav) {
  io$1.head_ = 0;
  let uInt32_ = {bits: 32, be: false};
  let uInt16_ = {bits: 16, be: false};
  readRIFFChunk_(buffer, wav, uInt32_, uInt16_);
  /** @type {!Object} */
  let chunk = riffChunks(buffer);
  readDs64Chunk_(buffer, chunk.subChunks, wav, uInt32_);
  readFmtChunk_(buffer, chunk.subChunks, wav, uInt32_, uInt16_);
  readFactChunk_(buffer, chunk.subChunks, wav, uInt32_);
  readBextChunk_(buffer, chunk.subChunks, wav, uInt32_, uInt16_);
  readCueChunk_(buffer, chunk.subChunks, wav, uInt32_);
  readSmplChunk_(buffer, chunk.subChunks, wav, uInt32_);
  readDataChunk_(buffer, chunk.subChunks, samples, wav);
  readJunkChunk_(buffer, chunk.subChunks, wav);
  readLISTChunk_(buffer, chunk.subChunks, wav, uInt32_, uInt16_);
}

/**
 * Read the RIFF chunk a wave file.
 * @param {!Uint8Array} bytes A wav buffer.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @throws {Error} If no 'RIFF' chunk is found.
 * @private
 */
function readRIFFChunk_(bytes, wav, uInt32_, uInt16_) {
  io$1.head_ = 0;
  wav.container = io$1.readString_(bytes, 4);
  if (['RIFF', 'RIFX', 'RF64'].indexOf(wav.container) === -1) {
    throw Error('Not a supported format.');
  }
  uInt16_.be = wav.container === 'RIFX';
  uInt32_.be = uInt16_.be;
  wav.chunkSize = io$1.read_(bytes, uInt32_);
  wav.format = io$1.readString_(bytes, 4);
  if (wav.format != 'WAVE') {
    throw Error('Could not find the "WAVE" format identifier');
  }
}

/**
 * Read the 'fmt ' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @throws {Error} If no 'fmt ' chunk is found.
 * @private
 */
function readFmtChunk_(buffer, signature, wav, uInt32_, uInt16_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'fmt ');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.fmt.chunkId = chunk.chunkId;
    wav.fmt.chunkSize = chunk.chunkSize;
    wav.fmt.audioFormat = io$1.read_(buffer, uInt16_);
    wav.fmt.numChannels = io$1.read_(buffer, uInt16_);
    wav.fmt.sampleRate = io$1.read_(buffer, uInt32_);
    wav.fmt.byteRate = io$1.read_(buffer, uInt32_);
    wav.fmt.blockAlign = io$1.read_(buffer, uInt16_);
    wav.fmt.bitsPerSample = io$1.read_(buffer, uInt16_);
    readFmtExtension_(buffer, wav, uInt32_, uInt16_);
  } else {
    throw Error('Could not find the "fmt " chunk');
  }
}

/**
 * Read the 'fmt ' chunk extension.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readFmtExtension_(buffer, wav, uInt32_, uInt16_) {
  if (wav.fmt.chunkSize > 16) {
    wav.fmt.cbSize = io$1.read_(buffer, uInt16_);
    if (wav.fmt.chunkSize > 18) {
      wav.fmt.validBitsPerSample = io$1.read_(buffer, uInt16_);
      if (wav.fmt.chunkSize > 20) {
        wav.fmt.dwChannelMask = io$1.read_(buffer, uInt32_);
        wav.fmt.subformat = [
          io$1.read_(buffer, uInt32_),
          io$1.read_(buffer, uInt32_),
          io$1.read_(buffer, uInt32_),
          io$1.read_(buffer, uInt32_)];
      }
    }
  }
}

/**
 * Read the 'fact' chunk of a wav file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readFactChunk_(buffer, signature, wav, uInt32_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'fact');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.fact.chunkId = chunk.chunkId;
    wav.fact.chunkSize = chunk.chunkSize;
    wav.fact.dwSampleLength = io$1.read_(buffer, uInt32_);
  }
}

/**
 * Read the 'cue ' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readCueChunk_(buffer, signature, wav, uInt32_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'cue ');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.cue.chunkId = chunk.chunkId;
    wav.cue.chunkSize = chunk.chunkSize;
    wav.cue.dwCuePoints = io$1.read_(buffer, uInt32_);
    for (let i=0; i<wav.cue.dwCuePoints; i++) {
      wav.cue.points.push({
        dwName: io$1.read_(buffer, uInt32_),
        dwPosition: io$1.read_(buffer, uInt32_),
        fccChunk: io$1.readString_(buffer, 4),
        dwChunkStart: io$1.read_(buffer, uInt32_),
        dwBlockStart: io$1.read_(buffer, uInt32_),
        dwSampleOffset: io$1.read_(buffer, uInt32_),
      });
    }
  }
}

/**
 * Read the 'smpl' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readSmplChunk_(buffer, signature, wav, uInt32_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'smpl');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.smpl.chunkId = chunk.chunkId;
    wav.smpl.chunkSize = chunk.chunkSize;
    wav.smpl.dwManufacturer = io$1.read_(buffer, uInt32_);
    wav.smpl.dwProduct = io$1.read_(buffer, uInt32_);
    wav.smpl.dwSamplePeriod = io$1.read_(buffer, uInt32_);
    wav.smpl.dwMIDIUnityNote = io$1.read_(buffer, uInt32_);
    wav.smpl.dwMIDIPitchFraction = io$1.read_(buffer, uInt32_);
    wav.smpl.dwSMPTEFormat = io$1.read_(buffer, uInt32_);
    wav.smpl.dwSMPTEOffset = io$1.read_(buffer, uInt32_);
    wav.smpl.dwNumSampleLoops = io$1.read_(buffer, uInt32_);
    wav.smpl.dwSamplerData = io$1.read_(buffer, uInt32_);
    for (let i=0; i<wav.smpl.dwNumSampleLoops; i++) {
      wav.smpl.loops.push({
        dwName: io$1.read_(buffer, uInt32_),
        dwType: io$1.read_(buffer, uInt32_),
        dwStart: io$1.read_(buffer, uInt32_),
        dwEnd: io$1.read_(buffer, uInt32_),
        dwFraction: io$1.read_(buffer, uInt32_),
        dwPlayCount: io$1.read_(buffer, uInt32_),
      });
    }
  }
}

/**
 * Read the 'data' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {boolean} samples True if the samples should be loaded.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @throws {Error} If no 'data' chunk is found.
 * @private
 */
function readDataChunk_(buffer, signature, samples, wav) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'data');
  if (chunk) {
    wav.data.chunkId = 'data';
    wav.data.chunkSize = chunk.chunkSize;
    if (samples) {
      wav.data.samples = buffer.slice(
        chunk.chunkData.start,
        chunk.chunkData.end);
    }
  } else {
    throw Error('Could not find the "data" chunk');
  }
}

/**
 * Read the 'bext' chunk of a wav file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readBextChunk_(buffer, signature, wav, uInt32_, uInt16_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'bext');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.bext.chunkId = chunk.chunkId;
    wav.bext.chunkSize = chunk.chunkSize;
    wav.bext.description = io$1.readString_(buffer, 256);
    wav.bext.originator = io$1.readString_(buffer, 32);
    wav.bext.originatorReference = io$1.readString_(buffer, 32);
    wav.bext.originationDate = io$1.readString_(buffer, 10);
    wav.bext.originationTime = io$1.readString_(buffer, 8);
    wav.bext.timeReference = [
      io$1.read_(buffer, uInt32_),
      io$1.read_(buffer, uInt32_)];
    wav.bext.version = io$1.read_(buffer, uInt16_);
    wav.bext.UMID = io$1.readString_(buffer, 64);
    wav.bext.loudnessValue = io$1.read_(buffer, uInt16_);
    wav.bext.loudnessRange = io$1.read_(buffer, uInt16_);
    wav.bext.maxTruePeakLevel = io$1.read_(buffer, uInt16_);
    wav.bext.maxMomentaryLoudness = io$1.read_(buffer, uInt16_);
    wav.bext.maxShortTermLoudness = io$1.read_(buffer, uInt16_);
    wav.bext.reserved = io$1.readString_(buffer, 180);
    wav.bext.codingHistory = io$1.readString_(
      buffer, wav.bext.chunkSize - 602);
  }
}

/**
 * Read the 'ds64' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @throws {Error} If no 'ds64' chunk is found and the file is RF64.
 * @private
 */
function readDs64Chunk_(buffer, signature, wav, uInt32_) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'ds64');
  if (chunk) {
    io$1.head_ = chunk.chunkData.start;
    wav.ds64.chunkId = chunk.chunkId;
    wav.ds64.chunkSize = chunk.chunkSize;
    wav.ds64.riffSizeHigh = io$1.read_(buffer, uInt32_);
    wav.ds64.riffSizeLow = io$1.read_(buffer, uInt32_);
    wav.ds64.dataSizeHigh = io$1.read_(buffer, uInt32_);
    wav.ds64.dataSizeLow = io$1.read_(buffer, uInt32_);
    wav.ds64.originationTime = io$1.read_(buffer, uInt32_);
    wav.ds64.sampleCountHigh = io$1.read_(buffer, uInt32_);
    wav.ds64.sampleCountLow = io$1.read_(buffer, uInt32_);
    //if (wav.ds64.chunkSize > 28) {
    //  wav.ds64.tableLength = unpack(
    //    chunkData.slice(28, 32), uInt32_);
    //  wav.ds64.table = chunkData.slice(
    //     32, 32 + wav.ds64.tableLength);
    //}
  } else {
    if (wav.container == 'RF64') {
      throw Error('Could not find the "ds64" chunk');
    }
  }
}

/**
 * Read the 'LIST' chunks of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readLISTChunk_(buffer, signature, wav, uInt32_, uInt16_) {
  /** @type {?Object} */
  let listChunks = findChunk(signature, 'LIST', true);
  if (listChunks === null) {
    return;
  }
  for (let j=0; j < listChunks.length; j++) {
    /** @type {!Object} */
    let subChunk = listChunks[j];
    wav.LIST.push({
      chunkId: subChunk.chunkId,
      chunkSize: subChunk.chunkSize,
      format: subChunk.format,
      subChunks: []});
    for (let x=0; x<subChunk.subChunks.length; x++) {
      readLISTSubChunks_(subChunk.subChunks[x],
        subChunk.format, buffer, wav, uInt32_, uInt16_);
    }
  }
}

/**
 * Read the sub chunks of a 'LIST' chunk.
 * @param {!Object} subChunk The 'LIST' subchunks.
 * @param {string} format The 'LIST' format, 'adtl' or 'INFO'.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readLISTSubChunks_(subChunk, format, buffer, wav, uInt32_, uInt16_) {
  if (format == 'adtl') {
    if (['labl', 'note','ltxt'].indexOf(subChunk.chunkId) > -1) {
      io$1.head_ = subChunk.chunkData.start;
      /** @type {!Object<string, string|number>} */
      let item = {
        chunkId: subChunk.chunkId,
        chunkSize: subChunk.chunkSize,
        dwName: io$1.read_(buffer, uInt32_)
      };
      if (subChunk.chunkId == 'ltxt') {
        item.dwSampleLength = io$1.read_(buffer, uInt32_);
        item.dwPurposeID = io$1.read_(buffer, uInt32_);
        item.dwCountry = io$1.read_(buffer, uInt16_);
        item.dwLanguage = io$1.read_(buffer, uInt16_);
        item.dwDialect = io$1.read_(buffer, uInt16_);
        item.dwCodePage = io$1.read_(buffer, uInt16_);
      }
      item.value = io$1.readZSTR_(buffer, io$1.head_);
      wav.LIST[wav.LIST.length - 1].subChunks.push(item);
    }
  // RIFF INFO tags like ICRD, ISFT, ICMT
  } else if(format == 'INFO') {
    io$1.head_ = subChunk.chunkData.start;
    wav.LIST[wav.LIST.length - 1].subChunks.push({
      chunkId: subChunk.chunkId,
      chunkSize: subChunk.chunkSize,
      value: io$1.readZSTR_(buffer, io$1.head_)
    });
  }
}

/**
 * Read the 'junk' chunk of a wave file.
 * @param {!Uint8Array} buffer The wav file buffer.
 * @param {!Object} signature The file signature.
 * @param {!WavBuffer} wav A WavBuffer instance.
 * @private
 */
function readJunkChunk_(buffer, signature, wav) {
  /** @type {?Object} */
  let chunk = findChunk(signature, 'junk');
  if (chunk) {
    wav.junk = {
      chunkId: chunk.chunkId,
      chunkSize: chunk.chunkSize,
      chunkData: [].slice.call(buffer.slice(
        chunk.chunkData.start,
        chunk.chunkData.end))
    };
  }
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * @fileoverview The WavBuffer class.
 * @see https://github.com/rochars/wavefile
 */

/**
 * A class representing the data in a wav buffer.
 */
class WavBuffer {

  /**
   * @throws {Error} If no 'RIFF' chunk is found.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  constructor() {
    /**
     * The container identifier.
     * 'RIFF', 'RIFX' and 'RF64' are supported.
     * @type {string}
     */
    this.container = '';
    /**
     * @type {number}
     */
    this.chunkSize = 0;
    /**
     * The format.
     * Always 'WAVE'.
     * @type {string}
     */
    this.format = '';
    /**
     * The data of the 'fmt' chunk.
     * @type {!Object<string, *>}
     */
    this.fmt = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      audioFormat: 0,
      /** @type {number} */
      numChannels: 0,
      /** @type {number} */
      sampleRate: 0,
      /** @type {number} */
      byteRate: 0,
      /** @type {number} */
      blockAlign: 0,
      /** @type {number} */
      bitsPerSample: 0,
      /** @type {number} */
      cbSize: 0,
      /** @type {number} */
      validBitsPerSample: 0,
      /** @type {number} */
      dwChannelMask: 0,
      /**
       * 4 32-bit values representing a 128-bit ID
       * @type {!Array<number>}
       */
      subformat: []
    };
    /**
     * The data of the 'fact' chunk.
     * @type {!Object<string, *>}
     */
    this.fact = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwSampleLength: 0
    };
    /**
     * The data of the 'cue ' chunk.
     * @type {!Object<string, *>}
     */
    this.cue = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwCuePoints: 0,
      /** @type {!Array<!Object>} */
      points: [],
    };
    /**
     * The data of the 'smpl' chunk.
     * @type {!Object<string, *>}
     */
    this.smpl = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      dwManufacturer: 0,
      /** @type {number} */
      dwProduct: 0,
      /** @type {number} */
      dwSamplePeriod: 0,
      /** @type {number} */
      dwMIDIUnityNote: 0,
      /** @type {number} */
      dwMIDIPitchFraction: 0,
      /** @type {number} */
      dwSMPTEFormat: 0,
      /** @type {number} */
      dwSMPTEOffset: 0,
      /** @type {number} */
      dwNumSampleLoops: 0,
      /** @type {number} */
      dwSamplerData: 0,
      /** @type {!Array<!Object>} */
      loops: []
    };
    /**
     * The data of the 'bext' chunk.
     * @type {!Object<string, *>}
     */
    this.bext = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {string} */
      description: '', //256
      /** @type {string} */
      originator: '', //32
      /** @type {string} */
      originatorReference: '', //32
      /** @type {string} */
      originationDate: '', //10
      /** @type {string} */
      originationTime: '', //8
      /**
       * 2 32-bit values, timeReference high and low
       * @type {!Array<number>}
       */
      timeReference: [0, 0],
      /** @type {number} */
      version: 0, //WORD
      /** @type {string} */
      UMID: '', // 64 chars
      /** @type {number} */
      loudnessValue: 0, //WORD
      /** @type {number} */
      loudnessRange: 0, //WORD
      /** @type {number} */
      maxTruePeakLevel: 0, //WORD
      /** @type {number} */
      maxMomentaryLoudness: 0, //WORD
      /** @type {number} */
      maxShortTermLoudness: 0, //WORD
      /** @type {string} */
      reserved: '', //180
      /** @type {string} */
      codingHistory: '' // string, unlimited
    };
    /**
     * The data of the 'ds64' chunk.
     * Used only with RF64 files.
     * @type {!Object<string, *>}
     */
    this.ds64 = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {number} */
      riffSizeHigh: 0, // DWORD
      /** @type {number} */
      riffSizeLow: 0, // DWORD
      /** @type {number} */
      dataSizeHigh: 0, // DWORD
      /** @type {number} */
      dataSizeLow: 0, // DWORD
      /** @type {number} */
      originationTime: 0, // DWORD
      /** @type {number} */
      sampleCountHigh: 0, // DWORD
      /** @type {number} */
      sampleCountLow: 0 // DWORD
      /** @type {number} */
      //'tableLength': 0, // DWORD
      /** @type {!Array<number>} */
      //'table': []
    };
    /**
     * The data of the 'data' chunk.
     * @type {!Object<string, *>}
     */
    this.data = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {!Uint8Array} */
      samples: new Uint8Array(0)
    };
    /**
     * The data of the 'LIST' chunks.
     * Each item in this list look like this:
     *  {
     *      chunkId: '',
     *      chunkSize: 0,
     *      format: '',
     *      subChunks: []
     *   }
     * @type {!Array<!Object>}
     */
    this.LIST = [];
    /**
     * The data of the 'junk' chunk.
     * @type {!Object<string, *>}
     */
    this.junk = {
      /** @type {string} */
      chunkId: '',
      /** @type {number} */
      chunkSize: 0,
      /** @type {!Array<number>} */
      chunkData: []
    };
  }
}

/*
 * Copyright (c) 2017-2018 Rafael da Silva Rocha.
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
 * Class representing a wav file.
 * @extends WavBuffer
 * @ignore
 */
class WaveFile extends WavBuffer {

  /**
   * @param {?Uint8Array=} bytes A wave file buffer.
   * @throws {Error} If no 'RIFF' chunk is found.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  constructor(bytes=null) {
    super();
    /**
     * The bit depth code according to the samples.
     * @type {string}
     */
    this.bitDepth = '0';
    /**
     * @type {!Object}
     * @private
     */
    this.dataType = {};
    // Load a file from the buffer if one was passed
    // when creating the object
    if (bytes) {
      this.fromBuffer(bytes);
    }
  }

  /**
   * Return the sample at a given index.
   * @param {number} index The sample index.
   * @return {number} The sample.
   * @throws {Error} If the sample index is off range.
   */
  getSample(index) {
    index = index * (this.dataType.bits / 8);
    if (index + this.dataType.bits / 8 > this.data.samples.length) {
      throw new Error('Range error');
    }
    return unpack$2(
      this.data.samples.slice(index, index + this.dataType.bits / 8),
      this.dataType);
  }

  /**
   * Set the sample at a given index.
   * @param {number} index The sample index.
   * @param {number} sample The sample.
   * @throws {Error} If the sample index is off range.
   */
  setSample(index, sample) {
    index = index * (this.dataType.bits / 8);
    if (index + this.dataType.bits / 8 > this.data.samples.length) {
      throw new Error('Range error');
    }
    packTo(sample, this.dataType, this.data.samples, index);
  }

  /**
   * Set up the WaveFile object based on the arguments passed.
   * @param {number} numChannels The number of channels
   *    (Integer numbers: 1 for mono, 2 stereo and so on).
   * @param {number} sampleRate The sample rate.
   *    Integer numbers like 8000, 44100, 48000, 96000, 192000.
   * @param {string} bitDepthCode The audio bit depth code.
   *    One of '4', '8', '8a', '8m', '16', '24', '32', '32f', '64'
   *    or any value between '8' and '32' (like '12').
   * @param {!Array<number>|!Array<!Array<number>>|!ArrayBufferView} samples
   *    The samples. Must be in the correct range according to the bit depth.
   * @param {?Object} options Optional. Used to force the container
   *    as RIFX with {'container': 'RIFX'}
   * @throws {Error} If any argument does not meet the criteria.
   */
  fromScratch(numChannels, sampleRate, bitDepthCode, samples, options={}) {
    if (!options.container) {
      options.container = 'RIFF';
    }
    this.container = options.container;
    this.bitDepth = bitDepthCode;
    samples = this.interleave_(samples);
    this.updateDataType_();
    /** @type {number} */
    let numBytes = this.dataType.bits / 8;
    this.data.samples = new Uint8Array(samples.length * numBytes);
    packArrayTo(samples, this.dataType, this.data.samples);
    /** @type {!Object} */
    let header = makeWavHeader(
      bitDepthCode, numChannels, sampleRate,
      numBytes, this.data.samples.length, options);
    this.clearHeader_();
    this.chunkSize = header.chunkSize;
    this.format = header.format;
    this.fmt = header.fmt;
    if (header.fact) {
      this.fact = header.fact;
    }
    this.data.chunkId = 'data';
    this.data.chunkSize = this.data.samples.length;
    validateWavHeader_(this);
  }

  /**
   * Set up the WaveFile object from a byte buffer.
   * @param {!Uint8Array} bytes The buffer.
   * @param {boolean=} samples True if the samples should be loaded.
   * @throws {Error} If container is not RIFF, RIFX or RF64.
   * @throws {Error} If no 'fmt ' chunk is found.
   * @throws {Error} If no 'data' chunk is found.
   */
  fromBuffer(bytes, samples=true) {
    this.clearHeader_();
    readWavBuffer(bytes, samples, this);
    this.bitDepthFromFmt_();
    this.updateDataType_();
  }

  /**
   * Return a byte buffer representig the WaveFile object as a .wav file.
   * The return value of this method can be written straight to disk.
   * @return {!Uint8Array} A .wav file.
   * @throws {Error} If any property of the object appears invalid.
   */
  toBuffer() {
    validateWavHeader_(this);
    return writeWavBuffer(this);
  }

  /**
   * Use a .wav file encoded as a base64 string to load the WaveFile object.
   * @param {string} base64String A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  fromBase64(base64String) {
    this.fromBuffer(new Uint8Array(decode$3(base64String)));
  }

  /**
   * Return a base64 string representig the WaveFile object as a .wav file.
   * @return {string} A .wav file as a base64 string.
   * @throws {Error} If any property of the object appears invalid.
   */
  toBase64() {
    /** @type {!Uint8Array} */
    let buffer = this.toBuffer();
    return encode$3(buffer, 0, buffer.length);
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
   * Force a file as RIFF.
   */
  toRIFF() {
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      this.bitDepth,
      unpackArray(this.data.samples, this.dataType));
  }

  /**
   * Force a file as RIFX.
   */
  toRIFX() {
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      this.bitDepth,
      unpackArray(this.data.samples, this.dataType),
      {container: 'RIFX'});
  }

  /**
   * Change the bit depth of the samples.
   * @param {string} newBitDepth The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats)
   * @param {boolean} changeResolution A boolean indicating if the
   *    resolution of samples should be actually changed or not.
   * @throws {Error} If the bit depth is not valid.
   */
  toBitDepth(newBitDepth, changeResolution=true) {
    /** @type {string} */
    let toBitDepth = newBitDepth;
    /** @type {string} */
    let thisBitDepth = this.bitDepth;
    if (!changeResolution) {
      if (newBitDepth != '32f') {
        toBitDepth = this.dataType.bits.toString();
      }
      thisBitDepth = this.dataType.bits;
    }
    this.assureUncompressed_();
    /** @type {number} */
    let sampleCount = this.data.samples.length / (this.dataType.bits / 8);
    /** @type {!Float64Array} */
    let typedSamplesInput = new Float64Array(sampleCount + 1);
    /** @type {!Float64Array} */
    let typedSamplesOutput = new Float64Array(sampleCount + 1);
    unpackArrayTo(this.data.samples, this.dataType, typedSamplesInput);
    if (thisBitDepth == "32f" || thisBitDepth == "64") {
      this.truncateSamples_(typedSamplesInput);
    }
    bitDepth(
      typedSamplesInput, thisBitDepth, toBitDepth, typedSamplesOutput);
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      newBitDepth,
      typedSamplesOutput,
      {container: this.correctContainer_()});
  }

  /**
   * Encode a 16-bit wave file as 4-bit IMA ADPCM.
   * @throws {Error} If sample rate is not 8000.
   * @throws {Error} If number of channels is not 1.
   */
  toIMAADPCM() {
    if (this.fmt.sampleRate !== 8000) {
      throw new Error(
        'Only 8000 Hz files can be compressed as IMA-ADPCM.');
    } else if (this.fmt.numChannels !== 1) {
      throw new Error(
        'Only mono files can be compressed as IMA-ADPCM.');
    } else {
      this.assure16Bit_();
      let output = new Int16Array(this.data.samples.length / 2);
      unpackArrayTo(this.data.samples, this.dataType, output);
      this.fromScratch(
        this.fmt.numChannels,
        this.fmt.sampleRate,
        '4',
        encode(output),
        {container: this.correctContainer_()});
    }
  }

  /**
   * Decode a 4-bit IMA ADPCM wave file as a 16-bit wave file.
   * @param {string} bitDepthCode The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   *    Optional. Default is 16.
   */
  fromIMAADPCM(bitDepthCode='16') {
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode(this.data.samples, this.fmt.blockAlign),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Encode a 16-bit wave file as 8-bit A-Law.
   */
  toALaw() {
    this.assure16Bit_();
    let output = new Int16Array(this.data.samples.length / 2);
    unpackArrayTo(this.data.samples, this.dataType, output);
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '8a',
      encode$1(output),
      {container: this.correctContainer_()});
  }

  /**
   * Decode a 8-bit A-Law wave file into a 16-bit wave file.
   * @param {string} bitDepthCode The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   *    Optional. Default is 16.
   */
  fromALaw(bitDepthCode='16') {
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode$1(this.data.samples),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Encode 16-bit wave file as 8-bit mu-Law.
   */
  toMuLaw() {
    this.assure16Bit_();
    let output = new Int16Array(this.data.samples.length / 2);
    unpackArrayTo(this.data.samples, this.dataType, output);
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '8m',
      encode$2(output),
      {container: this.correctContainer_()});
  }

  /**
   * Decode a 8-bit mu-Law wave file into a 16-bit wave file.
   * @param {string} bitDepthCode The new bit depth of the samples.
   *    One of '8' ... '32' (integers), '32f' or '64' (floats).
   *    Optional. Default is 16.
   */
  fromMuLaw(bitDepthCode='16') {
    this.fromScratch(
      this.fmt.numChannels,
      this.fmt.sampleRate,
      '16',
      decode$2(this.data.samples),
      {container: this.correctContainer_()});
    if (bitDepthCode != '16') {
      this.toBitDepth(bitDepthCode);
    }
  }

  /**
   * Write a RIFF tag in the INFO chunk. If the tag do not exist,
   * then it is created. It if exists, it is overwritten.
   * @param {string} tag The tag name.
   * @param {string} value The tag value.
   * @throws {Error} If the tag name is not valid.
   */
  setTag(tag, value) {
    tag = this.fixTagName_(tag);
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
   * Return the value of a RIFF tag in the INFO chunk.
   * @param {string} tag The tag name.
   * @return {?string} The value if the tag is found, null otherwise.
   */
  getTag(tag) {
    /** @type {!Object} */
    let index = this.getTagIndex_(tag);
    if (index.TAG !== null) {
      return this.LIST[index.LIST].subChunks[index.TAG].value;
    }
    return null;
  }

  /**
   * Return a Object<tag, value> with the RIFF tags in the file.
   * @return {!Object<string, string>} The file tags.
   */
  listTags() {
    /** @type {?number} */
    let index = this.getLISTINFOIndex_();
    /** @type {!Object} */
    let tags = {};
    if (index !== null) {
      for (let i = 0, len = this.LIST[index].subChunks.length; i < len; i++) {
        tags[this.LIST[index].subChunks[i].chunkId] =
          this.LIST[index].subChunks[i].value;
      }
    }
    return tags;
  }

  /**
   * Remove a RIFF tag in the INFO chunk.
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
   * Return an array with all cue points in the file, in the order they appear
   * in the file.
   * The difference between this method and using the list in WaveFile.cue
   * is that the return value of this method includes the position in
   * milliseconds of each cue point (WaveFile.cue only have the sample offset)
   * @return {!Array<!Object>}
   */
  listCuePoints() {
    /** @type {!Array<!Object>} */
    let points = this.getCuePoints_();
    for (let i = 0, len = points.length; i < len; i++) {
      points[i].milliseconds =
        (points[i].dwPosition / this.fmt.sampleRate) * 1000;
    }
    return points;
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
   * Set the string code of the bit depth based on the 'fmt ' chunk.
   * @private
   */
  bitDepthFromFmt_() {
    if (this.fmt.audioFormat === 3 && this.fmt.bitsPerSample === 32) {
      this.bitDepth = '32f';
    } else if (this.fmt.audioFormat === 6) {
      this.bitDepth = '8a';
    } else if (this.fmt.audioFormat === 7) {
      this.bitDepth = '8m';
    } else {
      this.bitDepth = this.fmt.bitsPerSample.toString();
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
   * Return an array with all cue points in the file, in the order they appear
   * in the file.
   * @return {!Array<!Object>}
   * @private
   */
  getCuePoints_() {
    /** @type {!Array<!Object>} */
    let points = [];
    for (let i = 0, len = this.cue.points.length; i < len; i++) {
      points.push({
        dwPosition: this.cue.points[i].dwPosition,
        label: this.getLabelForCuePoint_(
          this.cue.points[i].dwName)});
    }
    return points;
  }

  /**
   * Return the label of a cue point.
   * @param {number} pointDwName The ID of the cue point.
   * @return {string}
   * @private
   */
  getLabelForCuePoint_(pointDwName) {
    /** @type {?number} */
    let cIndex = this.getAdtlChunk_();
    if (cIndex !== null) {
      for (let i = 0, len = this.LIST[cIndex].subChunks.length; i < len; i++) {
        if (this.LIST[cIndex].subChunks[i].dwName ==
            pointDwName) {
          return this.LIST[cIndex].subChunks[i].value;
        }
      }
    }
    return '';
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

  /**
   * Return the index of the 'adtl' LIST in this.LIST.
   * @return {?number}
   * @private
   */
  getAdtlChunk_() {
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == 'adtl') {
        return i;
      }
    }
    return null;
  }

  /**
   * Return the index of the INFO chunk in the LIST chunk.
   * @return {?number} the index of the INFO chunk.
   * @private
   */
  getLISTINFOIndex_() {
    /** @type {?number} */
    let index = null;
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format === 'INFO') {
        index = i;
        break;
      }
    }
    return index;
  }

  /**
   * Return the index of a tag in a FILE chunk.
   * @param {string} tag The tag name.
   * @return {!Object<string, ?number>}
   *    Object.LIST is the INFO index in LIST
   *    Object.TAG is the tag index in the INFO
   * @private
   */
  getTagIndex_(tag) {
    /** @type {!Object<string, ?number>} */
    let index = {LIST: null, TAG: null};
    for (let i = 0, len = this.LIST.length; i < len; i++) {
      if (this.LIST[i].format == 'INFO') {
        index.LIST = i;
        for (let j=0, subLen = this.LIST[i].subChunks.length; j < subLen; j++) {
          if (this.LIST[i].subChunks[j].chunkId == tag) {
            index.TAG = j;
            break;
          }
        }
        break;
      }
    }
    return index;
  }

  /**
   * Fix a RIFF tag format if possible, throw an error otherwise.
   * @param {string} tag The tag name.
   * @return {string} The tag name in proper fourCC format.
   * @private
   */
  fixTagName_(tag) {
    if (tag.constructor !== String) {
      throw new Error('Invalid tag name.');
    } else if (tag.length < 4) {
      for (let i = 0, len = 4 - tag.length; i < len; i++) {
        tag += ' ';
      }
    }
    return tag;
  }

  /**
   * Reset attributes that should emptied when a file is
   * created with the fromScratch() or fromBuffer() methods.
   * @private
   */
  clearHeader_() {
    this.fmt.cbSize = 0;
    this.fmt.validBitsPerSample = 0;
    this.fact.chunkId = '';
    this.ds64.chunkId = '';
  }

  /**
   * Make the file 16-bit if it is not.
   * @private
   */
  assure16Bit_() {
    this.assureUncompressed_();
    if (this.bitDepth != '16') {
      this.toBitDepth('16');
    }
  }

  /**
   * Uncompress the samples in case of a compressed file.
   * @private
   */
  assureUncompressed_() {
    if (this.bitDepth == '8a') {
      this.fromALaw();
    } else if (this.bitDepth == '8m') {
      this.fromMuLaw();
    } else if (this.bitDepth == '4') {
      this.fromIMAADPCM();
    }
  }

  /**
   * Set up the WaveFile object from a byte buffer.
   * @param {!Array<number>|!Array<!Array<number>>|!ArrayBufferView}
   *   samples The samples.
   * @private
   */
  interleave_(samples) {
    if (samples.length > 0) {
      if (samples[0].constructor === Array) {
        /** @type {!Array<number>} */
        let finalSamples = [];
        for (let i = 0, len = samples[0].length; i < len; i++) {
          for (let j = 0, subLen = samples.length; j < subLen; j++) {
            finalSamples.push(samples[j][i]);
          }
        }
        samples = finalSamples;
      }
    }
    return samples;
  }

  /**
   * Update the type definition used to read and write the samples.
   * @private
   */
  updateDataType_() {
    /** @type {!Object} */
    this.dataType = {
      bits: ((parseInt(this.bitDepth, 10) - 1) | 7) + 1,
      float: this.bitDepth == '32f' || this.bitDepth == '64',
      signed: this.bitDepth != '8',
      be: this.container == 'RIFX'
    };
    if (['4', '8a', '8m'].indexOf(this.bitDepth) > -1 ) {
      this.dataType.bits = 8;
      this.dataType.signed = false;
    }
  }

  /**
   * Return 'RIFF' if the container is 'RF64', the current container name
   * otherwise. Used to enforce 'RIFF' when RF64 is not allowed.
   * @return {string}
   * @private
   */
  correctContainer_() {
    return this.container == 'RF64' ? 'RIFF' : this.container;
  }

  /**
   * Truncate float samples on over and underflow.
   * @private
   */
  truncateSamples_(samples) {
    /** @type {number} */   
    for (let i = 0, len = samples.length; i < len; i++) {
      if (samples[i] > 1) {
        samples[i] = 1;
      } else if (samples[i] < -1) {
        samples[i] = -1;
      }
    }
  }
}

export default WaveFile;
