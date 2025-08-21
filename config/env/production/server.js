module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'd8efc57b4a6e87123a6aa4cd13d2c015171e434192c7e3b60f339a8dee5116dd'), // Change this to a secure, unique value
    },
  },
});
