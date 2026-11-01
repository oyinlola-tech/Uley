from enum import StrEnum


class ImageScanStatus(StrEnum):
    CLEAN = "CLEAN"
    INFECTED = "INFECTED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
