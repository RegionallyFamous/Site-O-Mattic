import fs from "node:fs/promises";
import path from "node:path";

export async function imageInfo(filePath) {
  const buffer = await fs.readFile(filePath);
  const dimensions = imageDimensions(buffer, filePath);

  return {
    path: filePath,
    extension: path.extname(filePath).toLowerCase(),
    byteSize: buffer.length,
    width: dimensions.width,
    height: dimensions.height
  };
}

export function imageDimensions(buffer, filePath = "image") {
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return jpegDimensions(buffer, filePath);
  }

  throw new Error(`Unsupported image format: ${filePath}`);
}

function jpegDimensions(buffer, filePath) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7)
      };
    }

    offset += 2 + length;
  }

  throw new Error(`Could not read JPEG dimensions: ${filePath}`);
}
