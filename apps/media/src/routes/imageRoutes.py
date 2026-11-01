from fastapi import APIRouter

from src.controllers import delete_property_image, scan_property_image, scan_advertisement_image, sign_property_image_urls, get_signed_local_property_image
from src.models import DeleteImageRequest, ImageScanResponse, SignedImageRequest, SignedImageResponse
from src.models import ComplaintVideoResponse, SignedMediaRequest, SignedMediaResponse
from src.controllers import scan_complaint_video, sign_complaint_media_urls, get_signed_complaint_media
from src.controllers import start_multipart_upload, upload_multipart_part, get_multipart_upload_status, complete_multipart_upload, abort_multipart_upload
from src.models import MultipartUploadStatusResponse

image_router = APIRouter()
image_router.add_api_route("/properties/{property_id}/images", scan_property_image, methods=["POST"], response_model=ImageScanResponse)
image_router.add_api_route("/advertisements/{advertisement_id}/images", scan_advertisement_image, methods=["POST"], response_model=ImageScanResponse)
image_router.add_api_route("/images/signed-urls", sign_property_image_urls, methods=["POST"], response_model=SignedImageResponse)
image_router.add_api_route("/images/delete", delete_property_image, methods=["POST"], response_model=dict[str, bool])
image_router.add_api_route("/images/local/{storage_key:path}", get_signed_local_property_image, methods=["GET"])
image_router.add_api_route("/complaints/{complaint_id}/videos", scan_complaint_video, methods=["POST"], response_model=ComplaintVideoResponse)
image_router.add_api_route("/complaints/media/signed-urls", sign_complaint_media_urls, methods=["POST"], response_model=SignedMediaResponse)
image_router.add_api_route("/media/local/{storage_key:path}", get_signed_complaint_media, methods=["GET"])
image_router.add_api_route("/property-upload-sessions", start_multipart_upload, methods=["POST"])
image_router.add_api_route("/property-upload-sessions/{upload_id}/parts/{part_number}", upload_multipart_part, methods=["PUT"])
image_router.add_api_route("/property-upload-sessions/{upload_id}/status", get_multipart_upload_status, methods=["POST"], response_model=MultipartUploadStatusResponse)
image_router.add_api_route("/property-upload-sessions/{upload_id}/complete", complete_multipart_upload, methods=["POST"])
image_router.add_api_route("/property-upload-sessions/{upload_id}", abort_multipart_upload, methods=["DELETE"])
