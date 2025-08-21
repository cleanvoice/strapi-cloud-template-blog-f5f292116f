module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    enabled: true,
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'd8efc57b4a6e87123a6aa4cd13d2c015171e434192c7e3b60f339a8dee5116dd'), // Change this to a secure, unique value
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
