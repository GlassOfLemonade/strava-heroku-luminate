const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbConfig = require('./config');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

/* GET handlers */
// default
app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' });
});
// get activities from database
app.get('/strava-activities/:cons_id', dbConfig.getActivitiesByCons);
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

/* POST handlers */
// webhook
app.post('/webhook', dbConfig.receiveWebhook);

/* PUT handlers */

/* There are no DELETE calls */

app.listen(port, () => {
  console.log(`App running on port ${port}.`);
});
