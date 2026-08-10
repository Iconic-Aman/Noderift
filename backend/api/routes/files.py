import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/files", tags=["files"])

OUTPUT_DIR = Path(os.environ.get("NODERIFT_OUTPUT_DIR", "/tmp/noderift_outputs"))


@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated output file by filename safely."""
    clean_filename = os.path.basename(filename)
    file_path = OUTPUT_DIR / clean_filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File '{clean_filename}' not found.")

    return FileResponse(
        path=str(file_path),
        filename=clean_filename,
        media_type="application/octet-stream"
    )
