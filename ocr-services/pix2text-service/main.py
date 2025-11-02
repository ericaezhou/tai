from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pix2text import Pix2Text
from PIL import Image
import io
import time

app = FastAPI(title="Pix2Text Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pix2Text (loads once on startup)
# This engine is specialized for mathematical formulas
try:
    p2t = Pix2Text.from_config()
except Exception as e:
    print(f"Warning: Could not initialize Pix2Text with default config: {e}")
    p2t = Pix2Text()

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded image with math formula support
    Returns: {engine, text, confidence, processingTime, latex}
    """
    start_time = time.time()

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Perform OCR with Pix2Text
        result = p2t.recognize(image, return_text=True)

        # Parse results
        # Pix2Text returns a list of dictionaries with text and position info
        if isinstance(result, str):
            # Simple text output
            full_text = result
            latex_text = result
            confidence = 0.85  # Default confidence for Pix2Text
        elif isinstance(result, list):
            # Detailed output with positions
            texts = [item.get('text', '') for item in result if isinstance(item, dict)]
            full_text = " ".join(texts) if texts else ""
            latex_text = full_text
            confidence = 0.85
        elif isinstance(result, dict):
            # Single result
            full_text = result.get('text', '')
            latex_text = full_text
            confidence = result.get('score', 0.85)
        else:
            full_text = str(result)
            latex_text = full_text
            confidence = 0.85

        processing_time = (time.time() - start_time) * 1000  # ms

        return JSONResponse({
            "engine": "pix2text",
            "text": full_text,
            "latex": latex_text,  # LaTeX representation
            "confidence": confidence,
            "processingTime": processing_time
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "engine": "pix2text",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Pix2Text Microservice",
        "version": "1.0.0",
        "description": "Math formula OCR with LaTeX output",
        "endpoints": {
            "/ocr": "POST - Perform OCR on image",
            "/health": "GET - Health check"
        }
    }
