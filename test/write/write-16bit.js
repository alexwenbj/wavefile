/*!
 * Copyright (c) 2017 Rafael da Silva Rocha.
 * 
 */

var assert = require('assert');

describe('read 16bit file from disk and write to new file', function() {
    
    let fs = require("fs");
    let WaveFile = require("../../index.js");
    let path = "test/files/";
    
    let wBytes = fs.readFileSync(path + "16-bit-8kHz-noBext-mono.wav");
    let wav = new WaveFile();

    wav.fromBuffer(wBytes);

    let wav2 = new WaveFile();

    let bytes3 = wav.toBuffer();

    wav2.fromBuffer(bytes3);

    let bytes4 = wav2.toBuffer();

    fs.writeFileSync(path + "/out/16-bit-8kHz-noBext-mono.wav", bytes4);

    it("chunkId should be 'RIFF'",
            function() {
        assert.equal(wav2.chunkId, "RIFF");
    });
    it("fmtChunkId should be 'fmt '",
            function() {
        assert.equal(wav2.fmtChunkId, "fmt ");
    });
    it("format should be 'WAVE'",
            function() {
        assert.equal(wav2.format, "WAVE");
    });
    it("fmtChunkSize should be 16",
            function() {
        assert.equal(wav2.fmtChunkSize, 16);
    });
    it("audioFormat should be 1 (PCM)",
            function() {
        assert.equal(wav2.audioFormat, 1);
    });
    it("numChannels should be 1",
            function() {
        assert.equal(wav2.numChannels, 1);
    });
    it("sampleRate should be 8000",
            function() {
        assert.equal(wav2.sampleRate, 8000);
    });
    it("byteRate should be 16000",
            function() {
        assert.equal(wav2.byteRate, 16000);
    });
    it("blockAlign should be 2",
            function() {
        assert.equal(wav2.blockAlign, 2);
    });
    it("bitsPerSample should be 16",
            function() {
        assert.equal(wav2.bitsPerSample, 16);
    });
    it("dataChunkId should be 'data'",
            function() {
        assert.equal(wav2.dataChunkId, 'data');
    });
    it("dataChunkSize should be > 0",
            function() {
        assert.ok(wav2.dataChunkSize > 0);
    });
    it("samples.length should be > 0",
            function() {
        assert.ok(wav2.samples.length > 0);
    });
    it("samples on the new file should have the same length as in the original file",
            function() {
        assert.equal(wav2.samples.length, wav.samples.length);
    });
    it("samples on the new file should be same as the original file",
            function() {
        assert.deepEqual(wav2.samples, wav.samples);
    });
});
