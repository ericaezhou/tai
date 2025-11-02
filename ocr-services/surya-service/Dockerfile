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

# Pre-download Surya models during build
RUN python -c "from surya.ocr import run_ocr; from surya.model.detection.model import load_model as load_det_model, load_processor as load_det_processor; from surya.model.recognition.model import load_model as load_rec_model; from surya.model.recognition.processor import load_processor as load_rec_processor; load_det_model(); load_det_processor(); load_rec_model(); load_rec_processor()" || true

COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
