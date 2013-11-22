var test = require('tape');
var spawn = require('child_process').spawn;

var fs = require('fs');
var path = require('path');
var os = require('os');
var split = require('split');

var tmpdir = os.tmpdir || os.tmpDir;
var mkdirp = require('mkdirp');

var concat = require('concat-stream');
var through = require('through');

test('exec transform', function (t) {
    t.plan(4);
    var dir = path.join(tmpdir(), 'cat-watch-test-exec', Math.random()+'');
    mkdirp.sync(dir);
    var outfile = path.join(tmpdir(), 'cat-watch-exec-output-' + Math.random());
    
    fs.writeFileSync(path.join(dir, 'beep.txt'), 'beep');
    fs.writeFileSync(path.join(dir, 'boop.txt'), 'boop');
    var ps = spawn(process.execPath, [
        __dirname + '/../bin/cmd.js',
        '-c', __dirname + '/bin/uc.js',
        '-o', outfile,
        '-v',
        dir +  '/*.txt'
    ]);
    ps.stderr.pipe(process.stderr);
    ps.stdout.pipe(process.stdout);
    t.on('end', function () { ps.kill() });
    
    var expected = [ 'BEEPboop', 'BEEP boop', 'BEEP boop!', 'BEEP boop!!!' ];
    ps.stdout.pipe(split()).on('data', function (buf) {
        if (buf.length === 0) return;
        fs.readFile(outfile, 'utf8', function (err, src) {
            if (err) t.fail(err);
            t.equal(src, expected.shift());
            setTimeout(nextUpdate, 100);
        });
    });
    
    var updates = [
        [ 'beep.txt', 'beep ' ],
        [ 'boop.txt', 'boop!' ],
        [ 'c.txt', '!!' ]
    ];
    
    function nextUpdate () {
        if (updates.length === 0) return;
        var file = updates.shift();
        fs.writeFile(path.join(dir, file[0]), file[1], function (err) {
            if (err) return t.fail(err)
        });
    }
});
