-- Database-per-service: each service owns its database and role; there are no cross-service joins.
CREATE ROLE auth_svc LOGIN PASSWORD 'auth_pw';
CREATE ROLE user_svc LOGIN PASSWORD 'user_pw';
CREATE ROLE itinerary_svc LOGIN PASSWORD 'itinerary_pw';
CREATE ROLE alert_svc LOGIN PASSWORD 'alert_pw';
CREATE ROLE reroute_svc LOGIN PASSWORD 'reroute_pw';
CREATE ROLE culture_svc LOGIN PASSWORD 'culture_pw';
CREATE ROLE rag_worker LOGIN PASSWORD 'rag_pw';
CREATE ROLE admin_svc LOGIN PASSWORD 'admin_pw';

CREATE DATABASE auth_db OWNER auth_svc;
CREATE DATABASE user_db OWNER user_svc;
CREATE DATABASE itinerary_db OWNER itinerary_svc;
CREATE DATABASE alert_db OWNER alert_svc;
CREATE DATABASE reroute_db OWNER reroute_svc;
CREATE DATABASE culture_db OWNER culture_svc;
CREATE DATABASE rag_db OWNER rag_worker;
CREATE DATABASE admin_db OWNER admin_svc;

\c culture_db
CREATE EXTENSION IF NOT EXISTS vector;
\c rag_db
CREATE EXTENSION IF NOT EXISTS vector;
