const express         = require('express');
const cookieParser    = require('cookie-parser');
const async           = require('async');
const Config          = require('./controllers/config');
const MongoConnection = require('./controllers/data');
const AclController   = require('./controllers/acl');
const AuthController  = require('./controllers/auth');
const Validator       = require('./controllers/validation');
const log             = require('debug')('app:index');


const app = express();

/**
 * Async app initializer
 */
(async () => {

  const apiPort = Config.getConfig('api.port');

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());


  const dependencies = await initDependencies();
  if (!dependencies) {
    return process.exit(1);
  }

  // use app locals to share dependencies with route handlers
  app.locals = {
    ...app.locals,
    ...dependencies,
  };

  // create a context on the request
  app.use(AuthController.createContext.bind(AuthController));
  app.use('/health', require('./routes/health'));
  app.use('/auth', require('./routes/auth'));
  app.use('/devices', require('./routes/devices'));


  app.listen(
    apiPort,
    (err) => {
      if (err) {
        log(`error starting the server: ${err}`);
      } else {
        log(`api started on port ${apiPort}`);
      }
    }
  );

})();

function initDependencies() {
  return new Promise((resolve, _reject) => {
    async.auto({
      // initialize database connections
      database:  async () => {
        const client                = new MongoConnection(Config.getDatabaseConnectionString());
        const connectedSuccessfully = await client.connect();
        return connectedSuccessfully ? client : null;
      },
      validator: async () => new Validator().init()
    }, (error, results) => {
      if (error) {
        log(`an error occured: ${error}`);
        log('exiting process');
        return resolve(null);
      }

      log('init done');
      resolve(results);
    });
  });
}