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

db_migrate:
	docker compose exec asado_db psql -U asado_user asado_db -f /sql/0001.drop.file.sql
	docker compose exec asado_db psql -U asado_user asado_db -f /sql/0002.drop.folder.sql
	docker compose exec asado_db psql -U asado_user asado_db -f /sql/0003.create.folder.sql
	docker compose exec asado_db psql -U asado_user asado_db -f /sql/0004.create.file.sql

db_drop: stop
	rm -rf asado_db

db_shell:
	docker compose exec asado_db bash
