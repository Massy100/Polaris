# Pasos para levantar:
## Construir las imágenes
docker-compose build
## Levantar los contenedores en segundo plano
docker-compose up -d
## Verificar que los contenedores estén corriendo
docker-compose ps
## Aplicar migraciones iniciales
docker-compose exec backend python manage.py migrate
## Ver los logs 
docker-compose logs -f backend
docker-compose logs -f frontend
## Para acceder al contenedor
docker-compose exec backend bash
docker-compose exec frontend bash

# Acceder a applicaciones:
- Frontend Next.js: http://localhost:3000
- Backend API: http://localhost:8000/api
- Admin Django: http://localhost:8000/admin
- Adminer (BD): http://localhost:8080


