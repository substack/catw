var catw = require('../');
var brfs = require('brfs');
var test = require('tape');
var fs = require('fs');
var path = require('path');
var os = require('os');
var tmpdir = os.tmpdir || os.tmpDir;
var mkdirp = require('mkdirp');
var concat = require('concat-stream');
var through = require('through');

test('brfs transform', function (t) {
    t.plan(3);
    var dir = path.join(tmpdir(), 'cat-watch-test-exec', Math.random()+'');
    mkdirp.sync(dir);
    
    fs.writeFileSync(path.join(dir, 'beep.txt'), 'beep boop');
    fs.writeFileSync(path.join(dir, 'beep.js'), [
        "var fs = require('fs');",
        "var src = fs.readFileSync(__dirname + '/beep.txt', 'utf8');",
        "console.log(src.toUpperCase());"
    ].join('\n'));
    
    var cat = catw([ path.join(dir, '*.js'), path.join(dir, '*.txt') ], {
        transform: [ noTxt, brfs ]
    });
    t.on('end', function () { cat.close() });
    var expected = [ 'BEEP BOOP', 'RAWR', 'WOO' ];
    
    cat.on('stream', function (stream) {
        stream.pipe(concat(function (body) {
            Function(['console','require'],body)({ log: function (msg) {
                t.equal(msg, expected.shift());
            } }, require);
            setTimeout(nextUpdate, 100);
        }));
    });
    
    var updates = [
        [ 'beep.txt', 'rawr' ],
        [ 'beep.txt', 'woo' ]
    ];
    
    function nextUpdate () {
        if (updates.length === 0) return;
        var file = updates.shift();
        fs.writeFile(path.join(dir, file[0]), file[1], function (err) {
            if (err) return t.fail(err)
        });
    }
    
    function noTxt (file) {
        if (/\.txt$/.test(file)) {
            return through(function () {});
        }
        return through();
    }
});
