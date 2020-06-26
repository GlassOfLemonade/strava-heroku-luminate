require('dotenv').config();

const { Pool } = require('pg');
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: { rejectUnauthorized: false }
});

/* Query Functions */

/**
 * Getting activities by cons ID
 * must have cons_id in URL params
 */
const getActivitiesByCons = (request, response) => {
  const cons_id = parseInt(request.params.cons_id);

  pool.query(
    'SELECT * FROM activities WHERE cons_id = $1',
    [cons_id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    }
  );
};

/**
 * Post Interaction From LO
 */
const postInteraction = (request, response) => {
  const { info } = request.body;
  // TODO: revamp this function to include cons_id from request params

  pool.query('INSERT INTO activities (info) VALUES ($1)', [info], error => {
    if (error) {
      throw error;
    }
    response
      .status(201)
      .json({ status: 'success', message: 'interaction added to database ' });
  });
};

/**
 * Post Webhook From Strava
 */
const receiveWebhook = (request, response) => {
  // save the data
  const webhook = request.body;
  // TODO: do something with the data
  console.log(webhook);
  // confirm with webhook source
  response.status(200);
  // if update authorized: false is present, refresh token
};

module.exports = {
  isProduction,
  getActivitiesByCons,
  postInteraction,
  receiveWebhook,
  pool
};
