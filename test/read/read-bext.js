/*!
 * Copyright (c) 2017 Rafael da Silva Rocha.
 * 
 */

let assert = require("assert");

describe("BWF data reading", function() {

    let fs = require("fs");
    let wavefile = require("../../index.js");
    let path = "test/files/";
    
    let wBytes = fs.readFileSync(path + "24bit-16kHz-bext-mono.wav");
    let wav = new wavefile.WaveFile(wBytes);

    wav.fromBuffer(wBytes);

    it("should find the 'bext' chunk",
            function() {
        assert.equal(wav.bextChunkId, "bext");
    });
    it("bextChunkSize should be > 0",
            function() {
        assert.ok(wav.bextChunkSize > 0);
    });
    it("bextChunkString should be != ''",
            function() {
        assert.ok(wav.bextChunkString != "");
    });
});