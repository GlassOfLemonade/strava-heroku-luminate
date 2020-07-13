const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbConfig = require('./config');
const oAuth = require('./oauth');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, check } = require('express-validator');

const app = express();
const port = 3000;

/* USE setup */
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
const whitelist = [
  'https://cf-strava-luminate.herokuapp.com',
  'https://secure.conquercancer.ca',
  'https://ride.conquercancer.ca'
];
const corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(
  // cors({
  //   origin: dbConfig.isProduction
  //     ? 'https://cf-strava-luminate.herokuapp.com'
  //     : '*'
  // })
  cors(corsOptions)
);
app.use(compression());
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 min
    max: 500 // 500 times per min
  })
);

/* GET handlers */
// default
app.get('/', (request, response) => {
  response.status(200).json({ info: 'Node.js, Express, and Postgres API' });
});
// get activities from LO interactions
app.get('/strava-activities', dbConfig.getActivitiesByCons);
// get activities stats from Strava
app.get('/strava-activity-stats', dbConfig.getActivityStats);
// fetch user
app.get('/fetch-user', dbConfig.fetchUser);
// get handler for webhook to verify with strava
app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'cf-strava-inte-001a';
  // Parses the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.json({ 'hub.challenge': challenge });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
// oauth
app.get('/oauth', oAuth.oAuthHandler);

/* POST handlers */
// webhook
app.post('/webhook', dbConfig.receiveWebhook);

/* PUT handlers */

/* There are no DELETE calls */

app.listen(process.env.PORT || port, () => {
  console.log(`App running on port ${process.env.PORT}.`);
});
