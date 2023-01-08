const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apiEndpoint: process.env.API_ENDPOINT,
  apiKey: process.env.API_KEY
};