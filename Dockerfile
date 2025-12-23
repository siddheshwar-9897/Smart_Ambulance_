FROM python:3.11-slim

WORKDIR /app

# Install netcat for initContainer wait logic
RUN apt-get update && apt-get install -y netcat && apt-get clean

# Copy everything
COPY . .

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir "uvicorn[standard]" gunicorn

EXPOSE 8000

# Run app with Gunicorn + Uvicorn workers
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
