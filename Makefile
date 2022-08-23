all: build up

build:
	docker compose build

setup: build
	@mkdir asado_db && cp .env.sample .env

shell: up_dettached
	docker compose exec asado_api bash # Hasta que tenga un entrypoint hay que usar: docker compose run asado_api bash

up:
	docker compose up

up_dettached:
	docker compose up -d

psql:
	docker compose exec asado_db psql -U admin asado_db

drop_database:
	rm -rf asado_db
