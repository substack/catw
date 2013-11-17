# catw

concatenate file globs, watching for changes

# example

``` js
#!/usr/bin/env node

var catw = require('catw');
var fs = require('fs');

catw('*.txt', function (stream) {
    var w = stream.pipe(fs.createWriteStream('/tmp/bundle.txt'))
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
```
