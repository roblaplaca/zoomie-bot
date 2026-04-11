# ZoomieBot
Discord bot called Zoomie

# Local Database setup
brew install postgresql
brew services start postgresql

createdb zoomie_local

psql zoomie_local

CREATE USER xxx WITH PASSWORD 'xxxx';
GRANT ALL PRIVILEGES ON DATABASE zoomie_local TO xxx;

psql -h localhost -U xxxx -d zoomie_local -f data/migrations/001_create_watches.sql


Railway