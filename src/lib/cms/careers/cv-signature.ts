export const CV_HEAD_BYTES = 4096;

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SIGNATURES: Record<string, number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  [DOCX]: [0x50, 0x4b, 0x03, 0x04],
};

const LOCAL_HEADER = 0x04034b50;

function findHeader(head: Uint8Array, from: number): number {
  for (let i = from; i + 4 <= head.length; i += 1) {
    if (head[i] === 0x50 && head[i + 1] === 0x4b && head[i + 2] === 0x03 && head[i + 3] === 0x04) return i;
  }
  return -1;
}

/**
 * docx is a zip. Walk every local file header in the head (including data-descriptor entries, whose size is 0,
 * by scanning for the next signature). Accept when any entry is [Content_Types].xml or under word/; otherwise
 * accept a zip whose entries include _rels/ or docProps/ (some writers put those first).
 */
function docxHasWordEntry(head: Uint8Array): boolean {
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  const decoder = new TextDecoder();
  let weak = false;
  let pos = 0;
  while (pos >= 0 && pos + 30 <= head.length && view.getUint32(pos, true) === LOCAL_HEADER) {
    const compressed = view.getUint32(pos + 18, true);
    const nameLen = view.getUint16(pos + 26, true);
    const extraLen = view.getUint16(pos + 28, true);
    if (pos + 30 + nameLen > head.length) break;
    const name = decoder.decode(head.subarray(pos + 30, pos + 30 + nameLen));
    if (name === "[Content_Types].xml" || name.startsWith("word/")) return true;
    if (name.startsWith("_rels/") || name.startsWith("docProps/")) weak = true;
    const dataStart = pos + 30 + nameLen + extraLen;
    pos = compressed ? dataStart + compressed : findHeader(head, dataStart);
  }
  return weak;
}

/** Compares the first bytes of an object with the claimed mime type. */
export function headMatchesMime(head: Uint8Array, mime: string): boolean {
  const expected = SIGNATURES[mime];
  if (!expected || !expected.every((byte, i) => head[i] === byte)) return false;
  return mime === DOCX ? docxHasWordEntry(head) : true;
}
