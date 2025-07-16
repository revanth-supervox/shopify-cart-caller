// webhookHandler.js
const axios = require('axios');
require('dotenv').config(); // Ensure .env variables are loaded

const {
  SUPERVOX_ORG_ID,
  SUPERVOX_CAMPAIGN_ID,
  SUPERVOX_SCENARIO_ID,
  SUPERVOX_API_SECRET
} = process.env;

module.exports = async (req, res) => {
  try {
    const payload = req.body;

    const name = `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim();
    const phone = payload.customer?.phone || payload.phone || '';
    const cartItems = payload.line_items || [];

    console.log("🛒 Abandoned cart detected:", { name, phone, cartItems });

    if (!name || !phone || cartItems.length === 0) {
      console.log("❌ Missing required data");
      return res.status(400).send('Missing name, phone, or cart items.');
    }

    // Wait for 4 hours (in production). 
    setTimeout(async () => {
      try {
        await axios.post(
          `https://api.supervox.in/v1/incoming/${SUPERVOX_SCENARIO_ID}/${SUPERVOX_CAMPAIGN_ID}?organization_id=${SUPERVOX_ORG_ID}`,
          {
            name,
            phone,
            custom_fields: {
              cart: cartItems.map(item => `${item.title} x${item.quantity}`).join(', ')
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Secret': SUPERVOX_API_SECRET
            }
          }
        );

        console.log(`📞 Call triggered to ${phone}`);
      } catch (err) {
        console.error('❌ Failed to call Supervox API:', err.response?.data || err.message);
      }
    }, 4 * 60 * 60 * 1000); // 4 hours in ms

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error("❌ Error handling webhook:", err.message);
    res.status(500).send('Internal Server Error');
  }
};
