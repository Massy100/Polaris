# Imagen base
FROM node:20

# Instalar Python
RUN apk add --no-cache python3 py3-pip gcc musl-dev

WORKDIR /app

# -------------------------
# Backend
# -------------------------

COPY backend /app/backend

WORKDIR /app/backend

RUN pip3 install --upgrade pip
RUN apt-get update && apt-get install -y netcat-openbsd
RUN pip3 install -r requirements/development.txt

# -------------------------
# Frontend
# -------------------------

WORKDIR /app

COPY frontend /app/frontend

WORKDIR /app/frontend

RUN npm install

# -------------------------
# Puertos
# -------------------------

EXPOSE 3000
EXPOSE 8000

# -------------------------
# Start both services
# -------------------------

WORKDIR /app

CMD sh -c " cd backend && python manage.py migrate && python manage.py runserver 0.0.0.0:8000 & cd ../frontend && npm run dev "