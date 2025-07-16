// server.js
const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const authRoutes = require('./auth');
const webhookHandler = require('./webhookHandler');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/', authRoutes);
app.post('/webhooks/carts/create', webhookHandler);

app.get('/', (req, res) => {
  const shop = req.query.shop;

  if (shop) {
    // Redirect to /auth if shop param is present (OAuth step)
    return res.redirect(`/auth?shop=${shop}`);
  }

  // Default fallback if shop param is missing
  res.send('Welcome to Supervox Cart Caller App!');
});



app.listen(3000, () => {
  console.log(`App running on ${process.env.HOST}`);
});
