# Oficial Python image based on Debian
FROM python:3.11-slim

# Enviroment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Path for the project
WORKDIR /app

# System dependencies 
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements/ /app/requirements/
RUN pip install --upgrade pip
RUN pip install -r requirements/development.txt

# Copy project files
COPY . /app/

# Port
EXPOSE 8000

# Comand to run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]