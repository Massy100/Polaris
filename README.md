Backend:
# Construir las imágenes
docker-compose build
# Levantar los contenedores en segundo plano
docker-compose up -d
# Verificar que los contenedores estén corriendo
docker-compose ps
# Ver los logs del backend
docker-compose logs -f backend
# Aplicar migraciones iniciales
docker-compose exec backend python manage.py migrate

