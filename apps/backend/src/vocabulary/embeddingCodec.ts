export function encodeEmbedding(vector: number[]): Buffer {
  return Buffer.from(new Float32Array(vector).buffer);
}

export function decodeEmbedding(buffer: Buffer): Float32Array {
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
