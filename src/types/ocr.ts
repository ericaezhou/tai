// OCR Type Definitions for Multi-Scan Consensus System

export interface BoundingBox {
  bbox: number[]; // [x1, y1, x2, y2] or flattened polygon coordinates
  text?: string;
  confidence?: number;
}

export interface OCREngine {
  name: 'paddleocr' | 'pix2text' | 'surya' | 'mathpix' | 'easyocr' | 'trocr' | 'unsiloed';
  endpoint: string;
  timeout: number;
  supportsHandwriting: boolean;
  supportsMath: boolean;
  costPerPage?: number;
  weight?: number; // Reliability weight for consensus voting
}

export interface OCRRequest {
  imageBuffer: Buffer;
  questionNumber?: number;
  contentType?: 'text' | 'math' | 'auto';
  preprocessing?: PreprocessingOptions;
}

export interface OCRResult {
  engine: string;
  text: string;
  confidence: number;
  processingTime: number; // milliseconds
  boundingBoxes?: BoundingBox[];
  latex?: string; // For math-specialized engines
  metadata?: {
    pageNumber?: number;
    pageIndex?: number;
    segmentIndex?: number;
    modelVersion?: string;
    language?: string;
    questionNumber?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    segmentationScore?: number;
    lines?: Array<{
      text: string;
      confidence: number;
      bbox: number[];
    }>;
  };
}

export interface PreprocessingOptions {
  denoise?: boolean;
  enhanceContrast?: boolean;
  autoRotate?: boolean;
  sharpen?: boolean;
  dpi?: number;
  questionSegmentation?: QuestionSegmentationOptions;
}

export interface QuestionSegmentationOptions {
  enabled?: boolean;
  minSegmentHeight?: number;
  minWhitespaceHeight?: number;
  whitespaceThreshold?: number;
  margin?: number;
  minInkDensity?: number;
  evenSplitFallback?: boolean;
}

export interface MultiScanRequest {
  pdfBuffer: Buffer;
  engines: string[];
  questionNumbers: number[];
  consensusMethod: 'majority' | 'weighted' | 'clustering' | 'ai_arbiter';
  preprocessing?: PreprocessingOptions;
  useCache?: boolean;
}

export interface ConsensusResult {
  finalText: string;
  confidence: number;
  method: 'unanimous' | 'majority' | 'weighted' | 'clustering' | 'ai_arbiter';
  individualResults: OCRResult[];
  needsReview: boolean;
  aiValidation?: AIValidationResult;
  agreementRatio?: number; // Percentage of engines that agreed
}

export interface AIValidationResult {
  correctedText: string;
  confidence: number;
  reasoning: string;
  errors: string[];
  mathValid?: boolean;
}

export interface QuestionResult {
  questionNumber: number;
  individualResults: OCRResult[];
  consensus: ConsensusResult;
  groundTruth?: string; // For accuracy testing
  accuracy?: number; // 0-100% match with ground truth
  source?: {
    pageIndex: number;
    segmentIndex: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    segmentationScore?: number;
  };
}

export interface MultiScanResult {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  questions: QuestionResult[];
  performance: PerformanceMetrics;
  error?: string;
}

export interface PerformanceMetrics {
  totalTime: number; // milliseconds
  timePerQuestion: number; // milliseconds
  engineTimes: Record<string, number>; // milliseconds per engine
  costEstimate: number; // USD
  cacheHits?: number;
  cacheMisses?: number;
}

export interface OCRTestConfig {
  engines: string[];
  consensusMethod: 'majority' | 'weighted' | 'clustering' | 'ai_arbiter';
  preprocessing: PreprocessingOptions;
  questionNumbers: number[];
  useCache: boolean;
}

export interface OCREngineConfig {
  paddleocr?: {
    endpoint: string;
    useAngleCls: boolean;
    language: string;
  };
  pix2text?: {
    endpoint: string;
    includeLatex: boolean;
  };
  surya?: {
    endpoint: string;
    languages: string[];
  };
  mathpix?: {
    appId: string;
    appKey: string;
    endpoint?: string;
  };
  unsiloed?: {
    apiKey: string;
    baseUrl: string;
  };
}

// Consensus algorithm types
export type VoteResult = {
  text: string;
  score: number;
  count: number;
  sources: string[];
};

export type ClusterResult = {
  representative: string;
  members: OCRResult[];
  averageConfidence: number;
};

// Error detection types
export interface OCRError {
  type: 'substitution' | 'insertion' | 'deletion' | 'transposition';
  original: string;
  corrected: string;
  confidence: number;
  position?: number;
}

export interface MathValidation {
  isValid: boolean;
  errors: string[];
  corrected?: string;
  syntaxErrors?: string[];
  balancedParentheses?: boolean;
}
