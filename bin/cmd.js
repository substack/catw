#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var argv = require('optimist').argv;
var defined = require('defined');
var outfile = argv.o || '-';
var verbose = argv.v || argv.verbose;

if (argv.h || argv.help) {
    return fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);
}

if (argv._.length === 0) {
    if (outfile === '-') {
        process.stdin.pipe(process.stdout);
    }
    else {
        process.stdin.pipe(fs.createWriteStream(outfile));
    }
    return;
}

var catw = require('../');

var opts = { watch: defined(argv.w, argv.watch, outfile !== '-') };
var cat = catw(argv._, opts, function (stream) {
    if (outfile === '-') return stream.pipe(process.stdout);
    
    fs.exists(outfile, function (ex) {
        if (!ex) return stream.pipe(fs.createWriteStream(outfile));
        var tmpfile = path.dirname(outfile) + '/.' + path.basename(outfile)
            + '-' + Math.floor(Math.random() * Math.pow(16,8)).toString(16)
        ;
        var ws = stream.pipe(fs.createWriteStream(tmpfile));
        var bytes = 0;
        stream.on('data', function (buf) { bytes += buf.length });
        
        ws.on('close', function () {
            fs.rename(tmpfile, outfile, function (err) {
                if (err) console.error(err + '')
                else if (verbose) console.log(bytes + ' bytes written')
            });
        });
    })
});
