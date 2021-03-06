module.exports = {

  dataApis: {
    common:  {
      host: process.env.COMMON_API_HOST
    },
    devices: {
      host: process.env.DEVICES_API_HOST
    }
  },

  api: {
    port:        process.env.API_PORT || 80,
    version:     require('./package').version || 'N/A',
    environment: process.env.ENVIRONMENT
  },

  auth: {
    secret:           process.env.AUTH_SECRET,
    certificatesPath: process.env.CERTIFICATES_PATH,
    keyPassword:      process.env.KEY_PASSWORD,
  }

};