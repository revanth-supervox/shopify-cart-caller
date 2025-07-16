const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;

router.get('/auth', (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.status(400).send('Missing shop param');

  const redirectUri = `${process.env.HOST}/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=read_products,write_customers,read_checkouts&redirect_uri=${redirectUri}&state=123&grant_options[]=per-user`;

  res.redirect(installUrl);
});

router.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;

  console.log('🔁 Received callback with query:', req.query);

  if (!shop || !code) return res.status(400).send('Missing shop or code');

  const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;

  try {
    const tokenResponse = await axios.post(accessTokenUrl, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    });

    const accessToken = tokenResponse.data.access_token;
    console.log(`✅ Access token for ${shop}: ${accessToken}`);

    // Register webhook for abandoned checkouts
    const webhookUrl = `${process.env.HOST}/webhooks/carts/create`;

    try {
      await axios.post(
        `https://${shop}/admin/api/2024-04/webhooks.json`,
        {
          webhook: {
            topic: "checkouts/create",
            address: webhookUrl,
            format: "json"
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Webhook for abandoned carts registered for ${shop}`);
    } catch (err) {
      console.error('❌ Failed to register webhook:', err.response?.data || err.message);
    }

    res.redirect('/');
  } catch (err) {
    console.error('❌ Error exchanging code for access token:', err.response?.data || err.message);
    res.status(500).send('Token exchange failed');
  }
});

module.exports = router;
