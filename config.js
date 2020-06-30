require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');
const httpProxyAgent = require('http-proxy-agent');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: { rejectUnauthorized: false }
});

const proxy = process.env.QUOTAGUARDSHIELD_URL;
const agent = new httpProxyAgent(proxy);

/* Query Functions */

/**
 * Getting activities by cons ID
 * must have cons_id in URL params
 */
const getActivitiesByCons = (request, response) => {
  const cons_id = parseInt(request.params.cons_id);
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
  // confirm with webhook source
  response.status(200).end();
  // TODO: do something with the data
  console.log(webhook);
  if (
    webhook['aspect_type'] === 'create' &&
    webhook['object_type'] === 'activity'
  ) {
    // if new activity, call strava back with Get Activity
    const athlete_id = webhook['owner_id'];
    const activity_id = webhook['object_id'];
    var accessToken;
    var tokenType;
    var consId;
    const promiseQuery = new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM users WHERE strava_id = $1',
        [athlete_id],
        (error, results) => {
          if (error) {
            reject(error);
          }
          //console.log(results);
          const time_now = new Date(Date.now()) / 1000; // time in seconds
          //console.log(time_now);
          // save cons_id
          consId = results.rows[0]['cons_id'];
          // if token expired then refresh
          if (time_now > results.rows[0]['expires_at']) {
            // token has expired, call a refresh
            console.log('refreshing token...');
            const tokenReUrl =
              'https://www.strava.com/api/v3/oauth/token?' +
              'client_id=' +
              process.env.CLIENT_ID +
              '&' +
              'client_secret=' +
              process.env.CLIENT_SECRET +
              '&' +
              'grant_type=refresh_token' +
              '&' +
              'refresh_token=' +
              results.rows[0]['refresh_token'];
            axios
              .post(tokenReUrl)
              .then(function(response) {
                pool.query(
                  'UPDATE users SET token_type = $1, refresh_token = $2, access_token = $3, expires_at = $4',
                  [
                    response.data.token_type,
                    response.data.refresh_token,
                    response.data.access_token,
                    response.data.expires_at
                  ],
                  error => {
                    if (error) {
                      throw error;
                    }
                    console.log(athlete_id + ' updated in database.');
                    accessToken = response.data.access_token;
                    tokenType = response.data.token_type;
                    resolve([accessToken, tokenType]);
                    console.log('access token sent: ' + accessToken);
                  }
                );
              })
              .catch(function(error) {
                console.log(error);
              });
          } else {
            tokenType = results.rows[0]['token_type'];
            accessToken = results.rows[0]['access_token'];
            //console.log('accessToken: ' + accessToken);
            resolve([accessToken, tokenType]);
          }
        }
      );
    });
    promiseQuery.then(results => {
      // call API on get activity to get activity data
      //console.log(results);
      console.log('access token received: ' + results[0]);
      const activity_url =
        'https://www.strava.com/api/v3/activities/' +
        activity_id +
        '?include_all_efforts=false';
      const headers = {
        Authorization: results[1] + ' ' + results[0]
      };
      axios
        .get(activity_url, { headers: headers })
        .then(response => {
          // once activity data is obtained, call logInteraction on LO to save data
          console.log(response);
          // carve out a subset of data from response
          const shortResp = {
            athlete_id: response.data.athlete.id,
            name: response.data.name,
            distance: response.data.distance,
            moving_time: response.data['moving_time'],
            start_date: response.data['start_date_local'],
            elevation: response.data['total_elevation_gain']
          };
          const logInteractionUrl =
            'https://secure.conquercancer.ca/site/SRConsAPI?method=logInteraction&api_key=cfrca&v=1.0&response_format=json' +
            '&login_name=' +
            process.env.LO_API_USER +
            '&login_password=' +
            process.env.LO_API_PASS +
            '&cons_id=' +
            consId;
          const config = {
            headers: {
              'content-type': 'application/json'
            },
            httpsAgent: agent,
            httpsAgent: agent
          };
          const reqBody = {
            interaction_subject: 'year=2020 activity_id=' + response.data.id,
            interaction_body: JSON.stringify(shortResp),
            interaction_type_id: '1030'
          };
          axios
            .post(logInteractionUrl, reqBody, config)
            .then(response => {
              console.log('resp from log interaction call: ');
              console.log(response);
            })
            .catch(error => {
              console.log('error from log interaction call: ');
              console.log(error);
            });
        })
        .catch(error => {
          console.log(error);
        });
    });
  }
  // TODO: implement other types of webhook aspects from Strava
};

module.exports = {
  isProduction,
  getActivitiesByCons,
  postInteraction,
  receiveWebhook,
  pool
};
