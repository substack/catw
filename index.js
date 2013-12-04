var globwatcher = require('globwatcher').globwatcher;
var glob = require('glob');
var through = require('through');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var combine = require('stream-combiner');

module.exports = function (patterns, opts, cb) {
    if (!Array.isArray(patterns)) {
        patterns = [ patterns ];
    }
    if (typeof opts === 'function' || !opts) {
        cb = opts;
        opts = {}
    }
    if (!opts) opts = {};
    
    var transform = makeTransform(
        Array.isArray(opts.transform)
        ? opts.transform
        : [ opts.transform ].filter(Boolean)
    );
    
    var cat = new EventEmitter;
    var intervalHack;
    cat.close = (function () {
        var watchers = [], closed = false;
        cat.on('watcher', function (w) {
            if (closed) w.close();
            watchers.push(w);
        });
        return function () {
            closed = true;
            watchers.forEach(function (w) {
                w.close();
                clearInterval(w.fileWatcher.timer);
            });
            if (intervalHack) clearInterval(intervalHack);
        };
    })();
    var initStream = concat(function () {
        if (opts.watch !== false) {
            var w = watcher(function () {
                cat.emit('stream', concat());
            });
            cat.emit('watcher', w);
        }
    });
    
    if (cb) cat.on('stream', cb);
    process.nextTick(function () {
        cat.emit('stream', initStream);
    });
    return cat;
    
    function concat (cb) {
        var stream = through();
        
        (function nextPattern (index) {
            if (index >= patterns.length) {
                stream.queue(null);
                return cb && cb();
            }
            
            glob(patterns[index], function (err, files) {
                if (err) files = [];
                files.sort();
                if (files.length === 0) {
                    intervalHack = setInterval(function () {}, 1e8);
                }
                (function nextFile () {
                    if (files.length === 0) return nextPattern(index + 1);
                    
                    var file = files.shift();
                    var rs = fs.createReadStream(file)
                        .pipe(transform(file))
                    ;
                    rs.on('error', function (err) { stream.emit('error', err) });
                    
                    rs.pipe(stream, { end: false });
                    rs.on('data', function () {});
                    rs.on('end', nextFile);
                })();
            });
        })(0);
        
        return stream;
    }
    
    function watcher (cb) {
        var w = globwatcher(patterns);
        w.on('added', cb);
        w.on('deleted', cb);
        w.on('changed', cb);
        return w;
    }
};

function makeTransform (xs) {
    if (xs.length === 0) return function (file) {
        return through();
    };
    return function (file) {
        return combine.apply(null, xs.map(function (f) {
            return f(file);
        }));
    };
}
