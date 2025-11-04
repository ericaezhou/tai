# TAI - Teaching Assistant Intelligence

> Autonomous AI-powered grading system to reduce TA workload by automatically grading student submissions from handwritten PDFs.

🌐 **[Visit our website](https://ericaezhou.github.io/tai/)** | 📝 **[Join the waitlist](https://tally.so/r/44XQ05)**

## Overview

TAI (Teaching Assistant Intelligence) is a Next.js application that automates the grading process for educational assignments. It uses multi-engine OCR to extract handwritten work from PDFs, Claude AI to grade submissions based on rubrics, and provides a comprehensive interface for both instructors and students.

## Key Features

- **Multi-Engine OCR**: Extract handwritten answers from PDFs using Claude, PaddleOCR, Pix2Text, and Surya
- **AI-Powered Grading**: Automated grading using Claude Sonnet 4.5 with rubric-based assessment
- **Dual-Mode Interface**:
  - TA/Instructor view: Create assignments, manage rubrics, review submissions
  - Student view: Submit work, view grades and feedback
- **Consensus Algorithm**: Multiple OCR engines work together for higher accuracy
- **Solution Key Extraction**: Automatically parse solution PDFs to create answer keys
- **Real-time Feedback**: Detailed per-question feedback for students

## Architecture

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **AI/ML**: Anthropic Claude API, multiple OCR engines
- **Infrastructure**: Docker (OCR services), Redis (caching)
- **Charts**: Recharts for analytics visualization

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   TA Interface  │  │   Student    │  │  Server       │  │
│  │   - Create      │  │   Interface  │  │  Actions      │  │
│  │   - Review      │  │   - Submit   │  │  - Grading    │  │
│  │   - Analytics   │  │   - View     │  │  - OCR        │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    In-Memory Database                       │
│  Courses │ Assignments │ Submissions │ Rubrics │ Students   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐
│   Claude API     │  │ OCR Services│  │   Redis Cache    │
│   - Grading      │  │ - PaddleOCR │  │   - Results      │
│   - Extraction   │  │ - Pix2Text  │  │   - Jobs         │
│   - Rubrics      │  │ - Surya     │  │                  │
└──────────────────┘  └─────────────┘  └──────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Docker and Docker Compose (for OCR services)
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Add your API keys to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key
   # Optional: Other OCR service keys
   MATHPIX_APP_ID=your_mathpix_app_id
   MATHPIX_APP_KEY=your_mathpix_app_key
   ```

4. **Start OCR services (optional but recommended)**
   ```bash
   cd ocr-services
   docker-compose up -d
   ```

   This starts:
   - PaddleOCR service on port 8001
   - Pix2Text service on port 8002
   - Surya service on port 8003
   - Redis on port 6379

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Teaching Assistants / Instructors

1. **Create Assignment**
   - Upload problem set PDF
   - AI extracts rubric or create custom rubric
   - Set point values and grading criteria

2. **Add Solution Key**
   - Upload solution PDF
   - AI extracts answers
   - Review and confirm

3. **Review Submissions**
   - View auto-graded submissions
   - Adjust grades if needed
   - Release grades to students

### For Students

1. **View Assignments**
   - See all available assignments
   - Check due dates and requirements

2. **Submit Work**
   - Upload PDF of handwritten work
   - Wait for automatic grading

3. **View Results**
   - See total score
   - Review per-question feedback
   - Understand mistakes

## Project Structure

```
tai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main application page
│   │   ├── actions.ts         # Server actions
│   │   ├── api/               # API routes
│   │   ├── assignment/        # Assignment pages
│   │   └── dashboard/         # Analytics dashboard
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── assignment-*.tsx  # Assignment-related
│   │   └── student-*.tsx     # Student-related
│   ├── lib/                   # Core business logic
│   │   ├── database.ts       # In-memory database
│   │   ├── queries.ts        # Data access layer
│   │   ├── llm.ts            # Claude integration
│   │   ├── ocr/              # OCR engine integration
│   │   │   ├── engines/      # Individual engines
│   │   │   ├── consensus/    # Multi-engine consensus
│   │   │   └── preprocessing/# PDF processing
│   │   └── workflows/        # End-to-end pipelines
│   └── types/                # TypeScript definitions
├── ocr-services/             # Docker services
│   ├── paddleocr-service/
│   ├── pix2text-service/
│   └── surya-service/
├── python/                   # Python utilities
└── scripts/                  # Debug/test scripts
```

## OCR Engines

TAI supports multiple OCR engines for maximum accuracy:

| Engine | Best For | Speed | Accuracy |
|--------|----------|-------|----------|
| **Claude** | General text, math notation | Fast | High |
| **PaddleOCR** | Printed text | Very Fast | Medium |
| **Pix2Text** | Math formulas | Medium | High |
| **Surya** | Handwriting | Slow | High |
| **Mathpix** | Complex math | Fast | Very High |

The system uses consensus algorithms to combine results from multiple engines for better accuracy.

## Grading Workflow

```
1. Student uploads PDF submission
   ↓
2. Multi-engine OCR extraction
   ↓
3. Parse into structured answers (per question)
   ↓
4. Claude AI grades each question
   - Compares to solution key
   - Applies rubric criteria
   - Generates feedback
   ↓
5. TA reviews auto-graded submission
   ↓
6. Release grades to student
   ↓
7. Student views score + feedback
```

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/extract-answer-key` | POST | Extract solution key from PDF |
| `/api/extract-submission` | POST | Extract student answers |
| `/api/extraction-status/:jobId` | GET | Check extraction job status |
| `/api/ocr/multi-scan` | POST | Run multi-engine OCR |
| `/api/test-grading-pipeline` | POST | Test grading system |
| `/api/sync/assignment` | POST | Sync assignment data |
| `/api/sync/submission` | POST | Sync submission data |
| `/api/sync/rubric` | POST | Sync rubric data |
| `/api/submission-detail` | GET | Get submission details |

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY` - Required for Claude AI grading
- `MATHPIX_APP_ID` - Optional for Mathpix OCR
- `MATHPIX_APP_KEY` - Optional for Mathpix OCR
- `NEXT_PUBLIC_*` - Client-side environment variables

### File Upload Limits

- Max PDF size: 10MB
- Configurable in `next.config.ts`

## Development

### Running Tests
```bash
# No tests yet - see REFACTORING_PLAN.md
npm run test
```

### Type Checking
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Known Limitations

**Current Version (Prototype/MVP)**:
- In-memory database (data lost on restart)
- No authentication/authorization
- No persistent file storage
- No landing page or onboarding
- Limited error handling
- No test coverage

See [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) for production roadmap.

## Technology Choices

- **Next.js 16**: App Router for modern React patterns, Server Actions for type-safe APIs
- **Claude Sonnet 4.5**: State-of-the-art reasoning for accurate grading
- **Docker**: Isolated OCR services for reliability
- **TypeScript**: Type safety across entire stack
- **Radix UI**: Accessible, composable components

## Contributing

See issues and planned improvements in [REFACTORING_PLAN.md](./REFACTORING_PLAN.md).

## License

[Add license information]

## Contact

[Add contact information]
