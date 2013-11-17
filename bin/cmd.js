var catw = require('../');
var fs = require('fs');
var argv = require('optimist').argv;
var outfile = argv.o || '-';
var verbose = argv.v || argv.verbose;

var opts = { watch: argv.w !== false && outfile !== '-' };
var cat = catw(argv._, opts, function (stream) {
    if (outfile === '-') return stream.pipe(process.stdout);
    
    fs.exists(outfile, function (ex) {
        if (!ex) return stream.pipe(fs.createWriteStream(outfile));
        var tmpfile = '.' + outfile + '-'
            + Math.floor(Math.random() * Math.pow(16,8)).toString(16)
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
