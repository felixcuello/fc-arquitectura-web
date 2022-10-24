all: build up

build:
	docker compose build

setup: build
	@mkdir -p asado_db && cp .env.sample .env

shell:
	docker compose run asado_api bash

up:
	docker compose up

stop:
	docker compose stop

psql:
	docker compose exec asado_db psql -U asado_user asado_db

drop_database:
	rm -rf asado_db
