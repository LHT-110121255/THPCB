const express = require('express');
const router  = express.Router();
const sitesControllers = require('../app/controllers/query/SitesQuery');
const authenticateToken = require('../app/middleware/authenticateTokenAdmin');


router.use('/home', authenticateToken, sitesControllers.Index);
router.use('/', sitesControllers.login);

module.exports = router;