CREATE TABLE activities
(
  ID SERIAL PRIMARY KEY,
  cons_id VARCHAR(255) NOT NULL,
  info json NOT NULL
);

CREATE TABLE users
(
  ID SERIAL PRIMARY KEY,
  cons_id VARCHAR(255) NOT NULL,
  strava_id VARCHAR(255) NOT NULL,
  token_type VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) NOT NULL,
  expires_at VARCHAR(255) NOT NULL
);

