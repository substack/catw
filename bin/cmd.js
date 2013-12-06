#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var parseQuote = require('shell-quote').parse;
var combine = require('stream-combiner');
var copy = require('shallow-copy');
var resolve = require('resolve');

var argv = require('minimist')(process.argv.slice(2), {
    'boolean': [ 'v' ]
});
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

var commands = [].concat(argv.c).filter(Boolean).map(function (cmd) {
    return function (file) {
        var env = copy(process.env);
        env.FILE = file;
        var parts = parseQuote(cmd, env);
        
        var ps = spawn(parts[0], parts.slice(1), { env: env });
        ps.on('exit', function (code) {
            if (code !== 0) {
                outer.emit('error', new Error(
                    'non-zero exit code in command: ' + cmd
                ));
            }
        });
        ps.stderr.pipe(process.stderr);
        var outer = combine(ps.stdin, ps.stdout);
        return outer;
    };
});

var transforms = [].concat(argv.t).filter(Boolean).map(function (file) {
    if (/^[.\/]/.test(file)) {
        return require(path.resolve(file));
    }
    return require(resolve.sync(file, { basedir: process.cwd() }));
});

var opts = {
    watch: defined(argv.w, argv.watch, outfile !== '-'),
    transform: transforms.concat(commands)
};

catw(argv._, opts, function (stream) {
    if (outfile === '-') return stream.pipe(process.stdout);
    var bytes = 0;
    stream.on('data', function (buf) { bytes += buf.length });
    
    fs.exists(outfile, function (ex) {
        if (!ex) {
            var ws = stream.pipe(fs.createWriteStream(outfile));
            if (verbose) ws.on('close', function () {
                console.log(bytes + ' bytes written to ' + outfile);
            });
            return ws;
        }
        var tmpfile = path.dirname(outfile) + '/.' + path.basename(outfile)
            + '-' + Math.floor(Math.random() * Math.pow(16,8)).toString(16)
        ;
        var ws = stream.pipe(fs.createWriteStream(tmpfile));
        
        ws.on('close', function () {
            fs.rename(tmpfile, outfile, function (err) {
                if (err) console.error(err + '')
                else if (verbose) {
                    console.log(bytes + ' bytes written to ' + outfile);
                }
            });
        });
    });
});
