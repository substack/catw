var catw = require('../');
var test = require('tape');
var fs = require('fs');
var path = require('path');
var tmpdir = require('os').tmpdir;
var mkdirp = require('mkdirp');
var concat = require('concat-stream');

test('adding and updating files', function (t) {
    t.plan(4);
    var dir = path.join(tmpdir(), 'cat-watch-test-existing', Math.random()+'');
    mkdirp.sync(dir);
    
    fs.writeFileSync(path.join(dir, 'beep.txt'), 'beep');
    fs.writeFileSync(path.join(dir, 'boop.txt'), 'boop');
    
    var cat = catw(path.join(dir, '*.txt'));
    t.on('end', function () { cat.close() });
    var expected = [ 'beepboop', 'beep boop', 'beep boop!', 'beep boop!!!' ];
    
    cat.on('stream', function (stream) {
        stream.pipe(concat(function (body) {
            t.equal(body.toString('utf8'), expected.shift());
        }));
    });
    
    var updates = [
        [ 'beep.txt', 'beep ' ],
        [ 'boop.txt', 'boop!' ],
        [ 'c.txt', '!!' ]
    ];
    
    setTimeout(function next () {
        if (updates.length === 0) return;
        var file = updates.shift();
        fs.writeFile(path.join(dir, file[0]), file[1], function (err) {
            if (err) return t.fail(err)
            else setTimeout(next, 200)
        });
    }, 200);
});
