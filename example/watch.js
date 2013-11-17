#!/usr/bin/env node

var catw = require('../');
var fs = require('fs');

catw('*.txt', function (stream) {
    var w = stream.pipe(fs.createWriteStream('/tmp/bundle.txt'));
    w.on('close', function () { console.log('wrote to /tmp/bundle.txt') });
});
