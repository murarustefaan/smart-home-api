module.exports = {

  database: {
    host:     process.env.DATABASE_HOST || '127.0.0.1',
    port:     process.env.DATABASE_PORT || 27017,
    name:     process.env.DATABASE_NAME,
    user:     process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
  },

  api: {
    port:    process.env.API_PORT || 80,
    version: require('./package').version || 'N/A',
  },

  auth: {
    secret: process.env.AUTH_SECRET,
  }

};