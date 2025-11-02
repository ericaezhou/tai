FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Pre-download Surya models during build (support both new and legacy APIs)
RUN python - <<'PY'
import importlib
import importlib.util
import sys


def init_modern_surya():
    from surya.models import load_predictors
    predictors = load_predictors()
    # Touch the predictors so weights are fetched during build
    for name in ("detection", "recognition", "layout", "ocr_error", "table_rec"):
        predictors.get(name)
    print("Initialized modern Surya predictors:", ", ".join(sorted(predictors.keys())))


def init_legacy_surya(initial_failure: Exception | None = None):
    package = None
    for candidate in ("surya", "surya_ocr"):
        try:
            importlib.import_module(f"{candidate}.ocr")
            package = candidate
            break
        except ModuleNotFoundError:
            continue

    if package is None:
        detail = "Unable to import Surya OCR package (tried 'surya' and 'surya_ocr')"
        if initial_failure is not None:
            detail += f"; initial modern import error: {initial_failure}"
        raise SystemExit(detail)

    ocr_module = importlib.import_module(f"{package}.ocr")
    det_model_module = importlib.import_module(f"{package}.model.detection.model")
    det_processor_module = importlib.import_module(f"{package}.model.detection.processor")
    rec_model_module = importlib.import_module(f"{package}.model.recognition.model")
    rec_processor_module = importlib.import_module(f"{package}.model.recognition.processor")

    getattr(det_model_module, "load_model")()
    getattr(det_processor_module, "load_processor")()
    getattr(rec_model_module, "load_model")()
    getattr(rec_processor_module, "load_processor")()
    getattr(ocr_module, "run_ocr")
    print(f"Initialized legacy Surya modules via '{package}' namespace")


modern_spec = importlib.util.find_spec("surya.models")
if modern_spec is not None:
    try:
        init_modern_surya()
    except Exception as modern_err:  # pragma: no cover - defensive fallback
        print(f"Modern Surya initialization failed: {modern_err}", file=sys.stderr)
        init_legacy_surya(modern_err)
else:
    init_legacy_surya()
PY

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
