export function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(buffer);
  return arrayBuffer;
}

export function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  return new Blob([bufferToArrayBuffer(buffer)], { type: mimeType });
}
