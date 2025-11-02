from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from paddleocr import PaddleOCR
import numpy as np
from PIL import Image
import io
import time

app = FastAPI(title="PaddleOCR Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR (loads once on startup)
# use_angle_cls: Detect rotated text
# lang: Language model (en, ch, etc.)
# use_gpu: Set to True if GPU available
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='en',
    use_gpu=False,  # Set to True if GPU available
    show_log=False
)

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded image
    Returns: {engine, text, confidence, processingTime, lines}
    """
    start_time = time.time()

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        img_array = np.array(image)

        # Perform OCR
        result = ocr.ocr(img_array, cls=True)

        # Parse results
        texts = []
        confidences = []
        bboxes = []

        if result and result[0]:
            for line in result[0]:
                bbox, (text, confidence) = line
                texts.append(text)
                confidences.append(float(confidence))
                # Convert bbox to simple format
                bboxes.append({
                    'bbox': [float(coord) for point in bbox for coord in point],
                    'text': text,
                    'confidence': float(confidence)
                })

        # Combine all text
        full_text = " ".join(texts) if texts else ""
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        processing_time = (time.time() - start_time) * 1000  # ms

        return JSONResponse({
            "engine": "paddleocr",
            "text": full_text,
            "confidence": avg_confidence,
            "processingTime": processing_time,
            "lines": bboxes
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "engine": "paddleocr",
        "version": "2.7.3"
    }

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "PaddleOCR Microservice",
        "version": "1.0.0",
        "endpoints": {
            "/ocr": "POST - Perform OCR on image",
            "/health": "GET - Health check"
        }
    }
