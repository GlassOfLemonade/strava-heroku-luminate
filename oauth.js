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
      //console.log(response);
      dbConfig.pool.query(
        'INSERT INTO users (cons_id, strava_id, token_type, refresh_token, access_token, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          cons_id,
          response.data.athlete.id,
          response.data.token_type,
          response.data.refresh_token,
          response.data.access_token,
          response.data.expires_at
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

const refreshToken = new Promise((resolve, reject) => {
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

module.exports = { oAuthHandler, refreshToken };
