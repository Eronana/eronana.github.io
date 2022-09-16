---
title: "What is undefined.md"
date: 2022-09-16T04:46:53+00:00
layout: "page"
type: page
comments: false
---
# What is undefined.md

You often need to create markdown files, so you can run `touch filename.md` to create them, but the one problem is you need to type the tedious suffix `.md`.
So you wrote a Node.js script named `touchmd` to improve the situation:
```bash
cat /usr/local/bin/touchmd
#!/usr/bin/env node
require('fs').writeFileSync(process.argv[2] + '.md', '');
```

Then you ran `touchmd README` to create README.md, ran `touchmd CHANGELOG` to get CHANGELOG.md and so on.
```bash
mkdir the-greatest-project && cd "$_" && touchmd README && ls
README.md
touchmd CHANGELOG && ls
CHANGELOG.md  README.md
```

The script worked perfect and you got happy.

One day, you accidentally ran `touchmd` without any parameters.
```bash
mkdir yet-another-the-greatest-project && cd "$_" && touchmd
```

Guess what did you get?
```bash
ls
undefined.md
```

Congratulations! You got the `undefined.md`.
