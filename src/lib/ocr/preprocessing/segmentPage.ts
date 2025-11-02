import sharp from 'sharp';

export interface QuestionSegment {
  buffer: Buffer;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

export interface SegmentPageOptions {
  /**
   * Maximum number of segments to return (upper bound)
   */
  maxSegments?: number;
  /**
   * Per-row brightness threshold (0-255) considered whitespace
   */
  whitespaceThreshold?: number;
  /**
   * Minimum consecutive whitespace rows required to break segments
   */
  minWhitespaceHeight?: number;
  /**
   * Minimum height (in px) a text segment must have to be considered valid
   */
  minSegmentHeight?: number;
  /**
   * Number of extra pixels to include above/below detected text blocks
   */
  margin?: number;
  /**
   * Minimum ink density (0-1) required to keep a segment
   */
  minInkDensity?: number;
}

const DEFAULT_OPTIONS: Required<Omit<SegmentPageOptions, 'maxSegments'>> = {
  whitespaceThreshold: 245,
  minWhitespaceHeight: 24,
  minSegmentHeight: 140,
  margin: 18,
  minInkDensity: 0.0125,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Use simple whitespace-based segmentation to split a page into question-sized blocks.
 * Returns segments ordered from top to bottom.
 */
export async function segmentPageIntoQuestions(
  imageBuffer: Buffer,
  options: SegmentPageOptions = {}
): Promise<QuestionSegment[]> {
  const {
    whitespaceThreshold,
    minWhitespaceHeight,
    minSegmentHeight,
    margin,
    minInkDensity,
  } = { ...DEFAULT_OPTIONS, ...options };

  const sharpImage = sharp(imageBuffer);
  const { data, info } = await sharpImage
    .clone()
    .removeAlpha()
    .greyscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  if (!width || !height || channels <= 0) {
    return [];
  }

  const rowBrightness = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    const base = y * width * channels;
    let sum = 0;
    for (let x = 0; x < width; x++) {
      sum += data[base + x * channels];
    }
    rowBrightness[y] = sum / width; // 0=black, 255=white
  }

  // Identify whitespace rows using threshold with slight hysteresis for stability
  const whitespaceRows: boolean[] = new Array(height);
  for (let y = 0; y < height; y++) {
    whitespaceRows[y] = rowBrightness[y] >= whitespaceThreshold;
  }

  // Find contiguous text segments separated by whitespace bands
  const rawSegments: Array<{ top: number; bottom: number }> = [];
  let inText = false;
  let segmentStart = 0;
  let lastTextRow = 0;
  let whitespaceRun = 0;

  for (let y = 0; y < height; y++) {
    if (!whitespaceRows[y]) {
      if (!inText) {
        inText = true;
        segmentStart = clamp(y - margin, 0, height);
      }
      lastTextRow = y;
      whitespaceRun = 0;
    } else if (inText) {
      whitespaceRun += 1;
      if (whitespaceRun >= minWhitespaceHeight) {
        const segmentEnd = clamp(lastTextRow + margin, 0, height);
        if (segmentEnd - segmentStart >= minSegmentHeight) {
          rawSegments.push({ top: segmentStart, bottom: segmentEnd });
        }
        inText = false;
      }
    }
  }

  // Capture trailing segment if we ended on text
  if (inText) {
    const segmentEnd = clamp(lastTextRow + margin, 0, height);
    if (segmentEnd - segmentStart >= minSegmentHeight) {
      rawSegments.push({ top: segmentStart, bottom: segmentEnd });
    }
  }

  if (rawSegments.length === 0) {
    return [];
  }

  // Merge segments that are separated by only a thin whitespace gap
  const mergedSegments: Array<{ top: number; bottom: number }> = [];
  for (const segment of rawSegments) {
    if (mergedSegments.length === 0) {
      mergedSegments.push(segment);
      continue;
    }

    const prev = mergedSegments[mergedSegments.length - 1];
    if (segment.top - prev.bottom < minWhitespaceHeight * 0.75) {
      prev.bottom = segment.bottom;
    } else {
      mergedSegments.push(segment);
    }
  }

  const segments: QuestionSegment[] = [];

  for (const { top, bottom } of mergedSegments) {
    const heightPx = clamp(bottom - top, 1, height);
    const brightnessSum = rowBrightness
      .slice(top, bottom)
      .reduce((acc, value) => acc + value, 0);
    const inkDensity = 1 - brightnessSum / (heightPx * 255);

    if (inkDensity < minInkDensity) {
      continue;
    }

    const segmentBuffer = await sharpImage
      .clone()
      .extract({ left: 0, top, width, height: heightPx })
      .png()
      .toBuffer();

    segments.push({
      buffer: segmentBuffer,
      bbox: { x: 0, y: top, width, height: heightPx },
      score: inkDensity,
    });
  }

  segments.sort((a, b) => a.bbox.y - b.bbox.y);

  if (options.maxSegments && segments.length > options.maxSegments) {
    return segments.slice(0, options.maxSegments);
  }

  return segments;
}

/**
 * Evenly split a page into a target number of vertical slices.
 * Useful as a fallback when segmentation fails.
 */
export async function splitPageEvenly(
  imageBuffer: Buffer,
  segments: number
): Promise<QuestionSegment[]> {
  if (segments <= 0) return [];

  const sharpImage = sharp(imageBuffer);
  const metadata = await sharpImage.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (!width || !height) {
    return [];
  }

  const baseHeight = Math.floor(height / segments);
  const result: QuestionSegment[] = [];

  for (let index = 0; index < segments; index++) {
    const top = index * baseHeight;
    const remainingHeight = height - top;
    const segmentHeight =
      index === segments - 1 ? remainingHeight : Math.min(baseHeight, remainingHeight);

    if (segmentHeight <= 0) continue;

    const segmentBuffer = await sharpImage
      .clone()
      .extract({ left: 0, top, width, height: segmentHeight })
      .png()
      .toBuffer();

    result.push({
      buffer: segmentBuffer,
      bbox: { x: 0, y: top, width, height: segmentHeight },
      score: 0.0,
    });
  }

  return result;
}
