# Oficial Python image based on Debian
FROM python:3.11-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Path for the project
WORKDIR /app

# System dependencies 
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project files
COPY . /app/

# Port
EXPOSE 8000

# Comando para PRODUCCIÓN 
CMD ["gunicorn", "polaris.wsgi:application", "--bind", "0.0.0.0:8000"]