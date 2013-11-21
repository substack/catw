#!/usr/bin/env node

var through = require('through');
var path = require('path');
process.stdin.pipe(through(write)).pipe(process.stdout);

function write (buf) {
    if (path.basename(process.env.FILE) === 'beep.txt') {
        this.queue(buf.toString('utf8').toUpperCase());
    }
    else this.queue(buf);
}
