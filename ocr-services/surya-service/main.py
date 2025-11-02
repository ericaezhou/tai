import importlib.util as importlib_util
from importlib import import_module
import io
import time
from typing import Sequence

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image


class SuryaEngine:
    """Handles compatibility across Surya OCR package versions."""

    def __init__(self) -> None:
        self.mode: str | None = None  # 'modern' or 'legacy'
        self.det_predictor = None
        self.rec_predictor = None
        self.task_name = None

        self.run_ocr = None
        self.load_det_model = None
        self.load_det_processor = None
        self.load_rec_model = None
        self.load_rec_processor = None

        self.det_model = None
        self.det_processor = None
        self.rec_model = None
        self.rec_processor = None

        self.modern_error: Exception | None = None
        self.initialized = False

    def initialize(self) -> None:
        if self.initialized:
            return

        modern_spec = importlib_util.find_spec("surya.models")
        if modern_spec is not None:
            try:
                self._init_modern()
                self.initialized = True
                return
            except Exception as exc:  # pragma: no cover - defensive fallback
                self.modern_error = exc

        self._init_legacy()
        self.initialized = True

    def _init_modern(self) -> None:
        from surya.models import load_predictors
        from surya.common.surya.schema import TaskNames

        predictors = load_predictors()
        for predictor in predictors.values():
            if hasattr(predictor, "disable_tqdm"):
                predictor.disable_tqdm = True
            foundation = getattr(predictor, "foundation_predictor", None)
            if foundation and hasattr(foundation, "disable_tqdm"):
                foundation.disable_tqdm = True

        self.det_predictor = predictors["detection"]
        self.rec_predictor = predictors["recognition"]
        self.task_name = TaskNames.ocr_with_boxes
        self.mode = "modern"
        print("Initialized Surya modern API predictors")

    def _init_legacy(self) -> None:
        package = None
        run_ocr_module = None
        det_model_module = None
        det_processor_module = None
        rec_model_module = None
        rec_processor_module = None
        last_error: Exception | None = None

        for candidate in ("surya", "surya_ocr"):
            try:
                run_ocr_module = import_module(f"{candidate}.ocr")
                det_model_module = import_module(f"{candidate}.model.detection.model")
                det_processor_module = import_module(f"{candidate}.model.detection.processor")
                rec_model_module = import_module(f"{candidate}.model.recognition.model")
                rec_processor_module = import_module(f"{candidate}.model.recognition.processor")
                package = candidate
                break
            except ModuleNotFoundError as err:
                last_error = err
                continue

        if package is None:
            detail = "Surya OCR package not installed (checked 'surya' and 'surya_ocr')"
            if self.modern_error:
                detail += f"; modern API error: {self.modern_error}"
            raise RuntimeError(detail) from last_error

        self.run_ocr = getattr(run_ocr_module, "run_ocr")
        self.load_det_model = getattr(det_model_module, "load_model")
        self.load_det_processor = getattr(det_processor_module, "load_processor")
        self.load_rec_model = getattr(rec_model_module, "load_model")
        self.load_rec_processor = getattr(rec_processor_module, "load_processor")
        self.mode = "legacy"
        print(f"Using Surya legacy namespace: {package}")

    def ensure_models_loaded(self) -> None:
        self.initialize()

        if self.mode == "legacy":
            if self.det_model is None:
                self.det_model = self.load_det_model()
            if self.det_processor is None:
                self.det_processor = self.load_det_processor()
            if self.rec_model is None:
                self.rec_model = self.load_rec_model()
            if self.rec_processor is None:
                self.rec_processor = self.load_rec_processor()
        elif self.mode == "modern":
            # Models are materialized during predictor construction.
            pass
        else:
            raise RuntimeError("Surya engine is not initialized")

    def predict(self, image: Image.Image, langs: Sequence[str]) -> list:
        self.ensure_models_loaded()

        if self.mode == "modern":
            task_names = [self.task_name]
            return self.rec_predictor(
                [image],
                task_names=task_names,
                det_predictor=self.det_predictor,
                math_mode=True,
            )

        return self.run_ocr(
            [image],
            [list(langs)],
            self.det_model,
            self.det_processor,
            self.rec_model,
            self.rec_processor,
        )

    @property
    def models_ready(self) -> bool:
        if self.mode == "modern":
            return self.det_predictor is not None and self.rec_predictor is not None
        if self.mode == "legacy":
            return all([self.det_model, self.det_processor, self.rec_model, self.rec_processor])
        return False


app = FastAPI(title="Surya OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

surya_engine = SuryaEngine()


@app.on_event("startup")
async def load_models() -> None:
    try:
        surya_engine.ensure_models_loaded()
        print("Surya models loaded successfully")
    except Exception as exc:  # pragma: no cover - operational logging
        print(f"Warning: Could not load Surya models: {exc}")


@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded image using Surya.
    Returns: {engine, text, confidence, processingTime, lines}
    """
    start_time = time.time()

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        if image.mode != "RGB":
            image = image.convert("RGB")

        predictions = surya_engine.predict(image, langs=["en"])

        texts: list[str] = []
        confidences: list[float] = []
        lines_data: list[dict] = []

        if predictions:
            pred = predictions[0]
            for text_line in getattr(pred, "text_lines", []):
                text = getattr(text_line, "text", "")
                confidence = getattr(text_line, "confidence", 0.85)
                texts.append(text)
                confidences.append(confidence)
                bbox = getattr(text_line, "bbox", [])
                lines_data.append(
                    {
                        "text": text,
                        "confidence": confidence,
                        "bbox": bbox,
                    }
                )

        full_text = " ".join(texts) if texts else ""
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        processing_time = (time.time() - start_time) * 1000

        return JSONResponse(
            {
                "engine": "surya",
                "text": full_text,
                "confidence": avg_confidence,
                "processingTime": processing_time,
                "lines": lines_data,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {exc}") from exc


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    models_loaded = surya_engine.models_ready
    return {
        "status": "healthy" if models_loaded else "degraded",
        "engine": "surya",
        "models_loaded": models_loaded,
    }


@app.get("/")
async def root():
    """Root endpoint with service info."""
    return {
        "service": "Surya OCR Microservice",
        "version": "1.0.0",
        "description": "Layout-aware OCR with math support",
        "endpoints": {
            "/ocr": "POST - Perform OCR on image",
            "/health": "GET - Health check",
        },
    }
