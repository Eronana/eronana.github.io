---
title: Using Node.js to generate indexed PNG
date: 2022-09-15T16:04:21+08:00
tags: ['PNG', 'Node.js']
---

## A glance of indexed PNG
Most PNG images have three or four channels, that indicate RGB or RGBA.
But PNG files also support indexed images, so you can put a palette into it and use one channel to indicate the palette index to represent the image.
In this article, we are going to discuss how to generate indexed PNG images in Node.js.

According to the wiki [Portable Network Graphics](https://en.wikipedia.org/wiki/Portable_Network_Graphics), we know several parts of png:
1. Every png file starts with an 8-byte PNG signature: `'\x89PNG\r\n\x1a\n'`.
2. Followings are chunks. the structure of chunks is:
    - `length of data`: 4 bytes
    - `chunk type`: 4 bytes
    - `data`: length bytes
    - `CRC of type and data`: 4 bytes
3. The 4 chunks are required for indexed PNG is `IHDR`, `PLTE`, `IDAT`, and `IEND`.

## Preparation
First of all, we should decide how the image should be created.
I think a colorful 16*16-sized image would be good.
Then we need an array of `Buffer` to store the PNG data.
```js
const data = [];
```
Then we can use `data.push(someBuffer)` to append chunk buffers to the data.

## Header
Following the PNG format, just write the header.
```js
data.push(Buffer.from('\x89PNG\r\n\x1a\n', 'latin1')); // write the header
```

## Chunks
To write chunks properly, we need to implement a function called `generateChunk`:
```js
// use package crc-32 for calculate crc32,
// do not forget run `npm i crc-32` to install it.
const CRC32 = require('crc-32');
function generateChunk(type, data) {
  // 4 bytes length + 4 bytes type + 4 bytes crc + data length
  const buffer = Buffer.alloc(3 * 4 + data.length);
  // should calculate the crc32 of type and data
  const crc = CRC32.buf(data, CRC32.bstr(type));
  buffer.writeInt32BE(data.length);
  buffer.write(type, 4);
  data.copy(buffer, 8);
  buffer.writeInt32BE(crc, buffer.length - 4);
  return buffer;
}
```

There are 4 chunks to be written, let's solve them one by one.
### IHDR
There are so many fields in IHDR, but only the width and height are what we really care about.
```js
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(16);
ihdrData.writeUInt32BE(16, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 3; // color type = indexed color
ihdrData[10] = 0; // compression method, must be 0
ihdrData[11] = 0; // filter method, only 0 is avaliable
ihdrData[12] = 0 // interlace method = no interlace

// write the chunk
data.push(generateChunk('IHDR', ihdrData));
```

### PLTE
The palette, let's just make a colorful 256-length palette.
```js
// 3 bytes(r, g, b) * 256
const plteData = Buffer.alloc(256 * 3);
for (let i = 0; i < 256; i++) {
  plteData[i * 3 + 0] = (i % 7) * 36; // red
  plteData[i * 3 + 1] = Math.floor(i / 7) % 7 * 36; // green
  plteData[i * 3 + 2] = Math.floor(i / 7 / 7) * 36; // blue
}

data.push(generateChunk('PLTE', plteData));
```
### IDAT
This chunk is the actual image data chunk, it includes indices of the color.
We can just fill it from `0` to `16 * 16 - 1` to show all colors in the palette sequential.
The data of IDAT chunk should be compressed by Deflate, the `zlib` should be used.
The pre-compressed data should contain height rows, and each line starts with a filter type. Indexed PNG does not need any filter, which means each row should start with 0(None).
Since there is an extra byte indicating filter type in rows, the size of the data is (width + 1) * height = (16 + 1) * 16;
```js
const zlib = require('zlib');

const uncompressedData = Buffer.alloc(17 * 16);
for (let x = 0; x < 16; x++) {
  for (let y = 0; y < 16; y++) {
    uncompressedData[y * 17 + x + 1] = y * 16 + x;
  }
}
const idatData = zlib.deflateSync(uncompressedData);
data.push(generateChunk('IDAT', idatData));
```

### IEND
No data with chunk IEND, just create an empty Buffer as data.
```js
data.push(generateChunk('IEND', Buffer.alloc(0)));
```

## Save to file
Now we can concatenate the chunks to get the data buffer of the png image and write it into a file.
```js
const fs = require('fs');
const buffer = Buffer.concat(data);
fs.writeFileSync('indexed-image.png', buffer);
```

## The indexed-png
I've created a package called [indexed-png](https://github.com/Eronana/indexed-png) to do this, you can use it to generate a indexed png easily:
```js
import fs = require('fs');
import { createPNG } from 'indexed-png';
const palette = [];
for (let r = 0; r < 6; r++) {
  for (let g = 0; g < 6; g++) {
    for (let b = 0; b < 6; b++) {
      palette.push((r * 0x33) | ((g * 0x33) << 8) | ((b * 0x33) << 16));
    }
  }
}

(async () => {
  const width = 36;
  const height = 6
  const data = Buffer.from(Array(width * height).fill(0).map((_, i) => i % (6 * 6 * 6)));
  fs.writeFileSync('test.png', (await createPNG(data, palette, width, height)));
})();
```