# wavefile
Copyright (c) 2017-2018 Rafael da Silva Rocha.  
https://github.com/rochars/wavefile

[![NPM version](https://img.shields.io/npm/v/wavefile.svg?style=for-the-badge)](https://www.npmjs.com/package/wavefile) [![Example](https://img.shields.io/badge/example-online-blue.svg?style=for-the-badge)](https://rochars.github.io/wavefile/example)  
[![Codecov](https://img.shields.io/codecov/c/github/rochars/wavefile.svg?style=flat-square)](https://codecov.io/gh/rochars/wavefile) [![Unix Build](https://img.shields.io/travis/rochars/wavefile.svg?style=flat-square)](https://travis-ci.org/rochars/wavefile) [![Windows Build](https://img.shields.io/appveyor/ci/rochars/wavefile.svg?style=flat-square&logo=appveyor)](https://ci.appveyor.com/project/rochars/wavefile) [![Scrutinizer](https://img.shields.io/scrutinizer/g/rochars/wavefile.svg?style=flat-square&logo=scrutinizer)](https://scrutinizer-ci.com/g/rochars/wavefile/)

## About
**wavefile** is a module to work with .wav files in both Node.js and the browser.

With **wavefile** you can:
- Create wave files from scratch
- Read existing .wav files
- Read and write tags on .wav files
- Set and delete cue points and their labels
- Encode/decode files as ADPCM, A-Law and μ-Law
- Turn RIFF files to RIFX and RIFX files to RIFF
- Edit BWF metada ("bext" chunk)
- Change the bit depth of the audio

And more.

**wavefile** is extensively tested and contains samples of all supported formats. Some formats (like 8-bit A-Law and 64-bit floating point) are not widely supported and may not load in some players.

## Install
```
npm install wavefile
```

**wavefile** can be used as a dependency in projects that use Google Closure Compiler with ADVANCED_OPTIMIZATIONS.

## See it in action

### Using wavefile to extend the browser capabilities
https://rochars.github.io/wavefile/example

Drag and drop .wav files and play them. This example uses **wavefile** and **wavesurfer** to create a browser player that supports mu-Law, A-Law, IMA ADPCM, 64-bit wav files and more.

Web browsers can handle wave files with 8, 16, 24 and 32-bit data (with some exceptions). With **wavefile** you can extended this by changing the bit depth of wav files on the fly before loading them into the player:

Playing ADPCM in the browser
```javascript
// Load a wav file that is encoded as 4-bit IMA ADPCM:
let wav = new WaveFile(ADPCMFileBuffer);

// Decode the file to 16-bit PCM, supported by most browsers:
wav.fromIMAADPCM();

// Get the DataURI of your new, browser-friendly wav file:
let dataURI = wav.toDataURI();

// Load your new wav file into your player
// ...
```

Playing a 64-bit wave file in the browser
```javascript
// Load a wav file that has 64-bit audio:
let wav = new WaveFile(buffer);

// Change the bit depth to 16-bit, supported by most browsers:
wav.toBitDepth("16");

// Get the DataURI of your new, browser-friendly wav file:
let dataURI = wav.toDataURI();
```

With **wavefile** you can play A-Law, mu-Law, IMA-ADPCM and 64-bit wave files on browsers using the HTML5/JavaScript player of your choice. This example use **wavesurfer**.

Check out wavesurfer:  
https://github.com/katspaugh/wavesurfer.js

## Use
```javascript
// Load a wav file from disk into a WaveFile object
let wav = new WaveFile(buffer);

// Check some of the file properties
console.log(wav.container);
console.log(wav.chunkSize);
console.log(wav.fmt.chunkId);

// Call toBuffer() to get the bytes of the file.
// You can write the output straight to disk:
let wavBuffer = wav.toBuffer();

// Call toDataURI() to get the file as a base64-encoded
// DataURI to load the file a web browser:
wavDataURI = wav.toDataURI();
```

### Main methods

#### WaveFile.fromBuffer()
Load a .wav file from a byte buffer into a WaveFile object:
```javascript
WaveFile.fromBuffer(buffer);
```

This is the same as passing the buffer when creating the WaveFile object:
```javascript
let wav = new WaveFile(buffer);
```

#### WaveFile.fromScratch()
Create a WaveFile object with the arguments you pass:
```javascript
// A mono, 44.1 kHz, 32-bit .wav file with just 4 samples:
WaveFile.fromScratch(1, 44100, '32', [0, -2147483648, 2147483647, 4]);
```

#### WaveFile.toBuffer()
Return a Uint8Array with the WaveFile object data. The buffer is a .wav file and can be written to disk:
```javascript
buffer = wav.toBuffer();
```

#### WaveFile.toDataURI()
Return a DataURI string with the WaveFile object data. The DataURI is a .wav file and can be played in browsers:
```javascript
wavDataURI = wav.toDataURI();
```

#### WaveFile.setCuePoint()
Set a cue point with a text label in the file. The point position is informed in milliseconds:
```javascript
WaveFile.setCuePoint(1750, "some label");
```

#### WaveFile.deleteCuePoint()
Delete a cue point. The cue point is informed by the order they appear on the file (starting on 1):
```javascript
// remove the first cue point and its label
WaveFile.deleteCuePoint(1);
```

#### WaveFile.updateLabel()
Update the label text of a cue point. The cue point is informed by the order they appear on the file (starting on 1):
```javascript
// remove the first cue point and its label
WaveFile.updateLabel(2, "updated label");
```

#### WaveFile.setTag()
Create (or overwrite) a RIFF tag in the file:
```javascript
WaveFile.setTag("ICMT", "some comments");
```

#### WaveFile.getTag()
Return the value of a existing RIFF tag:
```javascript
WaveFile.getTag("ICMT");
```

#### WaveFile.deleteTag()
Remove a tag from the file:
```javascript
WaveFile.deleteTag("ICMT");
```

### Create wave files from scratch
You must inform the number of channels, the sample rate, the bit depth and the samples (in this order). The samples should be represented as an array of numbers. The array may be multidimensional if there is more than one channel.

#### Mono:
```javascript
let wav = new WaveFile();

// Create a mono wave file, 44.1 kHz, 32-bit and 4 samples
wav.fromScratch(1, 44100, '32', [0, -2147483648, 2147483647, 4]);
fs.writeFileSync(path, wav.toBuffer());
```

#### Stereo:
Samples can be informed interleaved or de-interleaved. If they are de-interleaved, WaveFile will interleave them. In this example they are de-interleaved.
```javascript
// Stereo, 48 kHz, 8-bit, de-interleaved samples
// WaveFile interleave the samples automatically
wav.fromScratch(2, 48000, '8', [
    [0, -2, 4, 3],
    [0, -1, 4, 3]
]);
fs.writeFileSync(path, wav.toBuffer());

// Default is RIFF. To create RIFX files:
wav.fromScratch(1, 44100, '32', samples, {"container": "RIFX"});
fs.writeFileSync(path, wav.toBuffer());
```
Possible values for the bit depth are:  
"4" - 4-bit IMA-ADPCM  
"8" - 8-bit  
"8a" - 8-bit A-Law  
"8m" - 8-bit mu-Law  
"16" - 16-bit  
"24" - 24-bit  
"32" - 32-bit  
"32f" - 32-bit floating point  
"64" - 64-bit floating point

You can also use any bit depth between "8" and "53", like **"11", "12", "17", "20" and so on**.

#### A word on bit depths
Files with sample resolutions other than 4, 8, 16, 24, 32 (integer), 32 (FP) and 64-bit (FP) are implemented as WAVE_FORMAT_EXTENSIBLE and may not be supported by some players. They can be played in the example page:  
https://rochars.github.io/wavefile/example  
They are converted to 16-bit before being loaded by the player, allowing normal reproduction.

### Interleave and de-interleave stereo samples
Samples in WaveFile objects are interleaved by default, even if you created the file from scratch using de-interleaved samples.

You can de-interleave them:
```javascript
// De-interleave the samples into multiple channels
wav.deInterleave();
```

To interleave them:
```javascript
// Interleave stereo samples
wav.interleave();
```

### Create tags on files
You can create tags on files with **WaveFile.setTag()** method. If the tag already exists, it's value is rewritten.
```javascript
// Write the ICMT tag with some comments to the file
wav.setTag("ICMT", "some comments");
```

To get the value of a tag (if it exists), use **WaveFile.getTag()**:
```javascript
console.log(wav.getTag("ICMT"));
// some comments
```

You can delete tags with **WaveFile.deleteTag()**:
```javascript
wav.deleteTag("ICMT");
```

### RIFF to RIFX and RIFX to RIFF
```javascript
// Turn a RIFF file to a RIFX file
wav.toRIFX();

// Turn a RIFX file to a RIFF file
wav.toRIFF();
```

### IMA-ADPCM
16-bit 8000 Hz mono wave files can be compressed as IMA-ADPCM:
```javascript
// Encode a 16-bit wave file as 4-bit IMA-ADPCM:
wav.toIMAADPCM();
```
IMA-ADPCM files compressed with **wavefile** will have a block align of 256 bytes.

If the audio is not 16-bit it will be converted to 16-bit before compressing. Compressing audio with sample rates different from 8000 Hz or number of channels greater than 1 will throw errors.

To decode 4-bit IMA-ADPCM as 16-bit linear PCM:
```javascript
// Decode 4-bit IMA-ADPCM as 16-bit:
wav.fromIMAADPCM();
```

Decoding always result in 16-bit audio. To decode to another bit depth:
```javascript
// Decode 4-bit IMA-ADPCM as 24-bit:
wav.fromIMAADPCM("24");
```

### A-Law
16-bit wave files (mono or stereo) can be encoded as A-Law:
```javascript
// Encode a 16-bit wave file as 8-bit A-law:
wav.toALaw();
```
If the audio is not 16-bit it will be converted to 16-bit before compressing.

To decode 8-bit A-Law as 16-bit linear PCM:
```javascript
// Decode 8-bit A-Law as 16-bit:
wav.fromALaw();
```

Decoding always result in 16-bit audio. To decode to another bit depth:
```javascript
// Decode 8-bit A-Law as 24-bit:
wav.fromALaw("24");
```

### mu-Law
16-bit wave files (mono or stereo) can be encoded as mu-Law:
```javascript
// Encode a 16-bit wave file as 8-bit mu-law:
wav.toMuLaw();
```
If the audio is not 16-bit it will be converted to 16-bit before compressing.

To decode 8-bit mu-Law as 16-bit linear PCM:
```javascript
// Decode 8-bit mu-Law as 16-bit:
wav.fromMuLaw();
```

Decoding always result in 16-bit audio. To decode to another bit depth:
```javascript
// Decode 8-bit mu-Law as 24-bit:
wav.fromMuLaw("24");
```

### Change the bit depth
You can change the bit depth of the audio with the **toBitDepth(bitDepth)** method.

```javascript
// Load a wav file with 32-bit audio
let wav = new WaveFile(fs.readFileSync("32bit-file.wav"));

// Change the bit depth to 24-bit
wav.toBitDepth("24");

// Write the new 24-bit file
fs.writeFileSync("24bit-file.wav", wav.toBuffer());
```

### The properties
Since **version 6.0.0** (2018-05-02) the samples are stored in **data.samples**.
```javascript
console.log(wav.data.samples);
// Output an array of numbers
```

The other public properties:
```javascript
let wav = new WaveFile(fs.readFileSync("file.wav"));

// The container data
console.log(wav.container); //"RIFF" or "RIFX"
console.log(wav.chunkSize);
console.log(wav.format); // WAVE

// "bext"
console.log(wav.bext.chunkId);
console.log(wav.bext.chunkSize);
// ...

// "fmt "
console.log(wav.fmt.chunkId);
console.log(wav.fmt.chunkSize);
console.log(wav.fmt.audioFormat);
console.log(wav.fmt.numChannels);
console.log(wav.fmt.sampleRate);
console.log(wav.fmt.byteRate);
console.log(wav.fmt.blockAlign);
console.log(wav.fmt.bitsPerSample);
// "fmt " extension
console.log(wav.fmt.cbSize);
console.log(wav.fmt.validBitsPerSample);
console.log(wav.fmt.dwChannelMask);
// subformat is a 128-bit GUID split into 4 32-bit values.
console.log(wav.fmt.subformat[0]); 
console.log(wav.fmt.subformat[1]); 
console.log(wav.fmt.subformat[2]);
console.log(wav.fmt.subformat[3]);

// "fact"
console.log(wav.fact.chunkId);
console.log(wav.fact.chunkSize);
console.log(wav.fact.dwSampleLength);

// "data"
console.log(wav.data.chunkId);
console.log(wav.data.chunkSize);
console.log(wav.data.samples);

// "cue "
console.log(wav.cue.chunkId);
console.log(wav.cue.chunkSize);

// "LIST"
console.log(wav.LIST.length);
```

#### BWF data
BWF data ("bext" chunk) is stored in the *bext* property.
```javascript
WaveFile.bext = {
    "chunkId": "",
    "chunkSize": 0,
    "description": "", // 256 chars
    "originator": "", // 32 chars
    "originatorReference": "", // 32 chars
    "originationDate": "", // 10 chars
    "originationTime": "", // 8 chars
    "timeReference": [], // 2 32-bit numbers representing a 64-bit value
    "version": 0, // 16-bit number
    "UMID": "", // 64 chars
    "loudnessValue": 0, // 16-bit number
    "loudnessRange": 0, // 16-bit number
    "maxTruePeakLevel": 0, // 16-bit number
    "maxMomentaryLoudness": 0, // 16-bit number
    "maxShortTermLoudness": 0, // 16-bit number
    "reserved": "", // 180 chars
    "codingHistory": "" // string, unlimited size
};
```

#### Cue points
You can create cue points using the **WaveFile.setCuePoint()** method. The method takes time in milliseconds and create a point in the corresponding position of the file:
```javascript
wav.setCuePoint(1750, "some label");
```

To delete a cue point use **WaveFile.deleteCuePoint()** inform the index of the point. Points are ordered according to their position. The first point is 1. Mind that deleting a point will change the index of other points (but not their position).
```javascript
wav.deleteCuePoint(1);
```

"cue " chunk data is stored as follows:
```javascript
WaveFile.cue = {
    "chunkId": "",
    "chunkSize": 0,
    "dwCuePoints": 0,
    "points": [],
};
```

Items in cue.points are objects with this signature:
```javascript
{
    "dwName": 0,
    "dwPosition": 0,
    "fccChunk": 0,
    "dwChunkStart": 0,
    "dwBlockStart": 0,
    "dwSampleOffset": 0,
}
```

#### LIST chunk
"LIST" chunk data is stored as follows:
```javascript
/**
 * An array of the "LIST" chunks present in the file.
 * @type {Array<Object>}
 */
WaveFile.LIST = [];
```

WaveFile.LIST is an array of objects with this signature:
```javascript
{
    /** @type {!string} */
    "chunkId": "", // always 'LIST'
    /** @type {!number} */
    "chunkSize": 0,
    /** @type {!string} */
    "format": "", // 'adtl' or 'INFO'
    /** @type {!Array<Object>} */
    "subChunks": []
};
```
Where "subChunks" are the subChunks of the "LIST" chunk. A single file may have many "LIST" chunks as long as their formats ("INFO", "adtl", etc) are not the same. **wavefile** can read and write "LIST" chunks of format "INFO" and "adtl".

For "LIST" chunks with the "INFO" format, "subChunks" is an array of objects with this signature:
```javascript
{
    /** @type {!string} */
    "chunkId": "" // some RIFF tag
    /** @type {!number} */
    "chunkSize" 0,
    /** @type {!string} */
    "value": ""
}
```
Where "chunkId" may be any RIFF tag:  
https://sno.phy.queensu.ca/~phil/exiftool/TagNames/RIFF.html#Info

#### RF64
**wavefile** have limited support of RF64 files. Changing the bit depth or applying compression to the samples will result in a RIFF file.

"ds64" data is stored as follows:
```javascript
wav.ds64 = {
    "chunkId": "",
    "chunkSize": 0,
    "riffSizeHigh": 0,
    "riffSizeLow": 0,
    "dataSizeHigh": 0,
    "dataSizeLow": 0,
    "originationTime": 0,
    "sampleCountHigh": 0,
    "sampleCountLow": 0
};
```
**The "ds64" chunk is read-only.**

### The samples
Range:
- 0 to 255 for 8-bit
- -32768 to 32767 for 16-bit
- -8388608 to 8388607 for 24-bit
- -2147483648 to 2147483647 for 32-bit
- -1.0 to 1.0 for 32-bit (float)
- -1.0 to 1.0 for 64-bit (float)

## References
https://tech.ebu.ch/docs/tech/tech3285.pdf  
https://tech.ebu.ch/docs/tech/tech3306-2009.pdf  
http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html  
http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/Samples.html  
https://www.loc.gov/preservation/digital/formats/fdd/fdd000356.shtml  
https://gist.github.com/hackNightly/3776503  
http://www.neurophys.wisc.edu/auditory/riff-format.txt  
https://github.com/chirlu/sox/blob/master/src/wav.c  
https://github.com/erikd/libsndfile  
http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/Docs/riffmci.pdf  
https://sites.google.com/site/musicgapi/technical-documents/wav-file-format?tmpl=%2Fsystem%2Fapp%2Ftemplates%2Fprint%2F&showPrintDialog=1#wavl  
https://sno.phy.queensu.ca/~phil/exiftool/TagNames/RIFF.html#Info

## LICENSE
Copyright (c) 2017-2018 Rafael da Silva Rocha.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
