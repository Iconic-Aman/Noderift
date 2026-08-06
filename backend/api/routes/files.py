import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated output file by filename safely."""
    clean_filename = os.path.basename(filename)
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    file_path = os.path.join(backend_dir, clean_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File '{clean_filename}' not found.")

    return FileResponse(
        path=file_path,
        filename=clean_filename,
        media_type="application/octet-stream"
    )
