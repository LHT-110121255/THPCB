const express = require('express');
const router  = express.Router();
const ModuleTkQuery = require('../app/controllers/query/ModuleTK');
const authenticateToken = require('../app/middleware/authenticateTokenAdmin');
const { route } = require('./api');

router.use('/createInfo', ModuleTkQuery.CreateInfo);
router.use('/homeInfo', ModuleTkQuery.homeInfo);
router.use('/createInput', ModuleTkQuery.createInput);
router.use('/createOutput', ModuleTkQuery.createOutput);


module.exports = router;