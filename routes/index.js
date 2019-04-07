var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  res.json({message: 'hello world'});
});

module.exports = router;
