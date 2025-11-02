# OCR Microservices

This directory contains Docker-based microservices for various OCR engines used in the multi-scan consensus system.

## Services

### 1. PaddleOCR (Port 8001)
- **Best for**: General handwriting recognition
- **Accuracy**: 70-85% on handwritten text
- **Strengths**: Fast, reliable, good general-purpose OCR
- **API**: `POST /ocr` - Upload image, get OCR result

### 2. Pix2Text (Port 8002)
- **Best for**: Mathematical formulas and equations
- **Accuracy**: 75-85% on math content
- **Strengths**: LaTeX output, specialized for math
- **API**: `POST /ocr` - Upload image, get text + LaTeX

### 3. Surya OCR (Port 8003)
- **Best for**: Layout-aware OCR with math support
- **Accuracy**: 70-80% overall
- **Strengths**: Good layout detection, handles mixed content
- **API**: `POST /ocr` - Upload image, get structured result

### 4. Redis (Port 6379)
- **Purpose**: Cache OCR results to avoid reprocessing
- **Optional**: Can be disabled if caching not needed

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- 10GB disk space for models

### Build and Start All Services

```bash
# Navigate to ocr-services directory
cd ocr-services

# Build all services (this will download models - may take 10-20 minutes)
docker-compose build

# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Test Individual Services

```bash
# Test PaddleOCR
curl http://localhost:8001/health

# Test with an image
curl -X POST -F "file=@test-image.png" http://localhost:8001/ocr

# Test Pix2Text
curl http://localhost:8002/health

# Test Surya
curl http://localhost:8003/health
```

## Environment Variables

Create a `.env` file in this directory (optional):

```bash
# GPU Support (set to 1 if GPU available)
USE_GPU=0

# Model download location
MODELS_DIR=/root/.cache

# Redis configuration
REDIS_PASSWORD=your_password_here
```

## Development

### Building Individual Services

```bash
# Build only PaddleOCR
docker-compose build paddleocr

# Start only PaddleOCR
docker-compose up paddleocr
```

### Rebuilding After Code Changes

```bash
# Rebuild specific service
docker-compose build --no-cache paddleocr

# Restart service
docker-compose restart paddleocr
```

## Model Downloads

Models are automatically downloaded during the Docker build process:
- **PaddleOCR**: ~200MB (detection + recognition models)
- **Pix2Text**: ~500MB (math formula recognition)
- **Surya**: ~1GB (layout + recognition models)

Models are cached in Docker volumes for faster subsequent builds.

## Production Deployment

For production, deploy these services to:
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Railway** (easiest setup)
- **Render**
- **Fly.io**
- **DigitalOcean App Platform**

Update the endpoint URLs in your Next.js environment variables:

```bash
PADDLEOCR_ENDPOINT=https://paddleocr.your-domain.com
PIX2TEXT_ENDPOINT=https://pix2text.your-domain.com
SURYA_ENDPOINT=https://surya.your-domain.com
REDIS_URL=redis://your-redis-url:6379
```

## Troubleshooting

### Services fail to start
```bash
# Check logs
docker-compose logs paddleocr

# Increase Docker memory limit (Docker Desktop -> Settings -> Resources)
# Recommended: 4GB minimum

# Clear volumes and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Models not downloading
```bash
# Manual model download (inside container)
docker-compose exec paddleocr python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"
```

### Port conflicts
```bash
# Change ports in docker-compose.yml
# For example, change "8001:8000" to "8011:8000"
```

## Performance Optimization

### GPU Support
To enable GPU acceleration (requires NVIDIA GPU + drivers):

1. Install nvidia-docker2
2. Update docker-compose.yml to use GPU runtime
3. Set `use_gpu=True` in Python code

### Reducing Memory Usage
- Use `docker-compose --compatibility` mode
- Limit container memory: add `mem_limit: 2g` to service configs
- Run services on separate hosts

## Cost Estimates

**Self-hosted (DigitalOcean/AWS)**:
- Small instance (2GB RAM): $12-20/month
- Medium instance (4GB RAM): $24-40/month
- Processing cost: ~$0.003-0.005/page

**Serverless (Google Cloud Run)**:
- Pay per request: ~$0.00002/request
- Cold start: 10-30 seconds
- Good for low volume

## Next Steps

1. Test all services locally: `docker-compose up -d`
2. Integrate with Next.js app (see `src/lib/ocr/engines/`)
3. Deploy to cloud platform
4. Set up monitoring and alerts
5. Optimize based on usage patterns
