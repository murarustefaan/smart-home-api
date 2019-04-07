const express         = require('express');
const cookieParser    = require('cookie-parser');
const async           = require('async');
const Config          = require('./controllers/config');
const MongoConnection = require('./controllers/data');
const log             = require('debug')('app:index');

const indexRouter     = require('./routes/index');
const usersRouter     = require('./routes/users');

const app = express();

/**
 * Async app initializer
 */
(async () => {

  const apiPort = Config.getConfig('api.port');

  app.use(express.json());
  app.use(express.urlencoded({extended: false}));
  app.use(cookieParser());


  // todo: maybe set them on some context
  const dependencies = await initDependencies();

  if (!dependencies) {
    return process.exit(1);
  }


  app.use('/', indexRouter);
  app.use('/users', usersRouter);


  app.listen(
    apiPort,
    (err) => {
      if (err) { log(`error starting the server: ${err}`); }
      else { log(`api started on port ${apiPort}`); }
    }
  );

})();

function initDependencies() {
  return new Promise((resolve, _reject) => {
    async.auto({
      // initialize database connections
      database: async () => {
        const client = new MongoConnection(Config.getDatabaseConnectionString());
        const connectedSuccessfully = await client.connect();
        return connectedSuccessfully ? client : null;
      }
    }, (error, results) => {
      if (error) {
        log('exiting process');
        return resolve(null);
      }

      log('init done');
      resolve(results);
    });
  });
}