from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from surya.ocr import run_ocr
from surya.model.detection.model import load_model as load_det_model, load_processor as load_det_processor
from surya.model.recognition.model import load_model as load_rec_model
from surya.model.recognition.processor import load_processor as load_rec_processor
from PIL import Image
import io
import time

app = FastAPI(title="Surya OCR Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
det_model = None
det_processor = None
rec_model = None
rec_processor = None

@app.on_event("startup")
async def load_models():
    global det_model, det_processor, rec_model, rec_processor
    try:
        det_model = load_det_model()
        det_processor = load_det_processor()
        rec_model = load_rec_model()
        rec_processor = load_rec_processor()
        print("Surya models loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load Surya models: {e}")

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded image using Surya
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

        # Perform OCR with Surya
        langs = ['en']  # Can be expanded to support multiple languages
        predictions = run_ocr(
            [image],
            [langs],
            det_model,
            det_processor,
            rec_model,
            rec_processor
        )

        # Parse results
        texts = []
        confidences = []
        lines_data = []

        if predictions and len(predictions) > 0:
            pred = predictions[0]
            for text_line in pred.text_lines:
                text = text_line.text
                confidence = text_line.confidence if hasattr(text_line, 'confidence') else 0.85

                texts.append(text)
                confidences.append(confidence)
                lines_data.append({
                    'text': text,
                    'confidence': confidence,
                    'bbox': text_line.bbox if hasattr(text_line, 'bbox') else []
                })

        # Combine all text
        full_text = " ".join(texts) if texts else ""
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        processing_time = (time.time() - start_time) * 1000  # ms

        return JSONResponse({
            "engine": "surya",
            "text": full_text,
            "confidence": avg_confidence,
            "processingTime": processing_time,
            "lines": lines_data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    models_loaded = all([det_model, det_processor, rec_model, rec_processor])
    return {
        "status": "healthy" if models_loaded else "degraded",
        "engine": "surya",
        "models_loaded": models_loaded
    }

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "Surya OCR Microservice",
        "version": "1.0.0",
        "description": "Layout-aware OCR with math support",
        "endpoints": {
            "/ocr": "POST - Perform OCR on image",
            "/health": "GET - Health check"
        }
    }
