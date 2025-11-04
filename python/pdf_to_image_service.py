#!/usr/bin/env python3
"""
PDF to Image Conversion Service

Uses PyMuPDF (fitz) for high-quality PDF-to-image conversion.
This solves the pdfjs-dist rendering issues in Node.js.

Usage:
    python pdf_to_image_service.py <pdf_path> [--dpi 300] [--format png]
"""

import sys
import json
import base64
from pathlib import Path
from typing import List, Optional
import argparse

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install PyMuPDF", file=sys.stderr)
    sys.exit(1)


def pdf_to_images(
    pdf_path: str,
    dpi: int = 300,
    output_format: str = "png"
) -> List[bytes]:
    """
    Convert PDF to list of image buffers.

    Args:
        pdf_path: Path to PDF file
        dpi: Resolution (default 300)
        output_format: 'png' or 'jpeg'

    Returns:
        List of image buffers (one per page)
    """
    images = []

    try:
        # Open PDF
        doc = fitz.open(pdf_path)

        # Calculate zoom for desired DPI (default PDF is 72 DPI)
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)

        # Convert each page
        for page_num in range(doc.page_count):
            page = doc[page_num]

            # Render page to pixmap (image)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            # Convert to bytes
            if output_format.lower() == "png":
                img_bytes = pix.tobytes("png")
            elif output_format.lower() in ["jpg", "jpeg"]:
                img_bytes = pix.tobytes("jpeg", jpg_quality=95)
            else:
                raise ValueError(f"Unsupported format: {output_format}")

            images.append(img_bytes)

        doc.close()
        return images

    except Exception as e:
        raise Exception(f"PDF conversion failed: {str(e)}")


def pdf_page_count(pdf_path: str) -> int:
    """Get number of pages in PDF."""
    try:
        doc = fitz.open(pdf_path)
        count = doc.page_count
        doc.close()
        return count
    except Exception as e:
        raise Exception(f"Failed to get page count: {str(e)}")


def main():
    parser = argparse.ArgumentParser(description="Convert PDF to images")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--dpi", type=int, default=300, help="Resolution (default: 300)")
    parser.add_argument("--format", default="png", choices=["png", "jpeg", "jpg"], help="Output format")
    parser.add_argument("--output-dir", help="Directory to save images (optional)")
    parser.add_argument("--json", action="store_true", help="Output as JSON with base64 encoded images")

    args = parser.parse_args()

    # Validate PDF exists
    pdf_path = Path(args.pdf_path)
    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        # Convert PDF to images
        images = pdf_to_images(str(pdf_path), dpi=args.dpi, output_format=args.format)

        if args.json:
            # Output as JSON
            result = {
                "success": True,
                "page_count": len(images),
                "dpi": args.dpi,
                "format": args.format,
                "images": [base64.b64encode(img).decode("utf-8") for img in images]
            }
            print(json.dumps(result))
        else:
            # Save images to disk
            output_dir = Path(args.output_dir) if args.output_dir else pdf_path.parent / "extracted_images"
            output_dir.mkdir(exist_ok=True, parents=True)

            ext = "png" if args.format == "png" else "jpg"

            for i, img_bytes in enumerate(images, 1):
                output_path = output_dir / f"{pdf_path.stem}_page{i}.{ext}"
                output_path.write_bytes(img_bytes)
                print(f"Saved: {output_path}")

            print(f"\nConverted {len(images)} pages successfully!")
            print(f"Output directory: {output_dir}")

    except Exception as e:
        if args.json:
            result = {"success": False, "error": str(e)}
            print(json.dumps(result))
        else:
            print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
