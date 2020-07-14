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
    .then(function(results) {
      // make entry to database user table
      //console.log(results);
      dbConfig.pool.query(
        'INSERT INTO users (cons_id, strava_id, token_type, refresh_token, access_token, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          cons_id,
          results.data.athlete.id,
          results.data.token_type,
          results.data.refresh_token,
          results.data.access_token,
          results.data.expires_at
        ],
        error => {
          if (error) {
            throw error;
          }
          console.log('user added to database.');
          response.send(200).json({
            status: 'success!',
            message: 'successfully integrated! please close this window.'
          });
        }
      );
    })
    .catch(function(error) {
      console.log(error);
    });
};

module.exports = { oAuthHandler };
