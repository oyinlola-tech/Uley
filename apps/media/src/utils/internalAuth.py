import hmac

from fastapi import Header, HTTPException

from src.configs import get_application_settings


def require_internal_service_token(authorization: str | None = Header(default=None)) -> None:
    expected_token = get_application_settings().service_api_key.get_secret_value()
    supplied_token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    if not supplied_token or not hmac.compare_digest(supplied_token, expected_token):
        raise HTTPException(status_code=401, detail="A valid service token is required.")
