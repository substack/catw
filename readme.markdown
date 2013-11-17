# catw

concatenate file globs, watching for changes

This module is just like the `cat` command, but with watching!

[![build status](https://secure.travis-ci.org/substack/catw.png)](http://travis-ci.org/substack/catw)

# example

``` js
#!/usr/bin/env node

var catw = require('catw');
var fs = require('fs');

catw('*.txt', function (stream) {
    var w = stream.pipe(fs.createWriteStream('/tmp/bundle.txt'));
    w.on('close', function () { console.log('wrote to /tmp/bundle.txt') });
});
```

If we run the program in a directory with files `a.txt` and `b.txt`, the
`bundle.txt` output will be both files concatenated together (in string-order by
filename):

```
beep
boop
```

If we edit `a.txt` to be `"BEEP"` instead of `"beep"`, the `bundle.txt` is now:

```
BEEP
boop
```

and then if we add a third file `c.txt` with the contents `"!!!"`, the output is
now:

```
BEEP
boop
!!!
```

We can even delete files. If we delete `b.txt`, the output is now:

```
BEEP
!!!
```

If we add a new file called `bloop.txt` with contents `"BLOOP"`, the
`bundle.txt` output is now:

```
BEEP
BLOOP
!!!
```

because the glob expansions of directories are sorted before concatenating.

# usage

There is a command-line `catw` command that ships with this package.

```
usage: catw {OPTIONS} [FILES...] -o OUTFILE

  If FILES is "-", read from stdin.
  If there is no OUTFILE, write to stdout and exit without watching.

  OPTIONS:

    -w, --watch    Watch for changes. Default: true except when writing to "-".
    -v, --verbose  Print the number of bytes written whenever a file changes.
    -h, --help     Print this help message.

Make sure to escape the globs that you want `catw` to watch so your shell won't
expand them.
```

# methods

``` js
var catw = require('catw')
```

## var cat = catw(patterns, opts={}, cb)

Create a new `cat` to concatenate `patterns`, an array of strings or a single
string and watch each of the `patterns` for changes: new files, deleted files,
and file updates.

It `opts.watch` is `false`, don't watch for changes, only concatenate once.

If specified, `cb(stream)` sets up a listener on the `'stream'` event.

## cat.close()

Stop listening for updates to the `patterns`.

# events

## cat.on('stream', function (stream) {})

Each time a file matched by a pattern changes or there is a new or deleted file
matched by a pattern, this event fires with a `stream` that will output the
concatenated file contents.

# install

To get the module, with [npm](https://npmjs.org) do:

```
npm install catw
```

and to get the `catw` command do:

```
npm install -g catw
```

# test

With [npm](https://npmjs.org) do:

```
npm test
```

# license

MIT
