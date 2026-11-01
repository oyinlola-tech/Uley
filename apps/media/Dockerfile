FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /service
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir . && useradd --no-create-home --uid 10001 media && mkdir -p /data/media && chown -R media:media /data/media
USER 10001
EXPOSE 8020
CMD ["python", "-m", "src.main"]
