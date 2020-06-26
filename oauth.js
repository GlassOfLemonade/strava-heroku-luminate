require('dotenv').config();
const axios = require('axios');
const dbConfig = require('./config');

const oAuthHandler = (request, response) => {
  // receive cons_id as part of strava oauth redirect URI
  // https://www.strava.com/oauth/authorize?client_id=49985&response_type=code&redirect_uri=https://cf-strava-luminate.herokuapp.com/oauth&approval_prompt=force&scope=read,activity:read,read_all&state=[insert cons_id here]
  const cons_id = request.query['state'];
  const authorization_code = request.query['code'];
  // post to token exchange
  const tokenExUrl =
    'https://www.strava.com/api/v3/oauth/token?' +
    'client_id=' +
    process.env.CLIENT_ID +
    '&' +
    'client_secret=' +
    process.env.CLIENT_SECRET +
    '&' +
    'code=' +
    authorization_code +
    '&' +
    'grant_type=authorization_code';
  axios
    .post(tokenExUrl)
    .then(function(response) {
      // make entry to database user table
      console.log(response);
      dbConfig.pool.query(
        'INSERT INTO users (cons_id, strava_id, token_type, refresh_token, access_token, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          cons_id,
          data.response.athlete.id,
          data.response.token_type,
          data.response.refresh_token,
          data.response.access_token,
          data.response.expires_at
        ],
        error => {
          if (error) {
            throw error;
          }
          console.log('user added to database.');
        }
      );
    })
    .catch(function(error) {
      console.log(error);
    });
};

const refreshToken = (request, response) => {};

module.exports = { oAuthHandler, refreshToken };
