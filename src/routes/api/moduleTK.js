const express = require('express');
const router = express.Router();
const CreateInfoCommand = require('../../app/controllers/command/moduleTK/CreateInfo');
const InfoQuery = require('../../app/controllers/query/ModuleTK');
const upload = require('../../app/Extesions/uploadAvatar');

router.post('/info/create', upload.none(), (req, res) => {
      CreateInfoCommand.Handle(req, res);
});
router.get('/info/get-all', (req, res) => {
      InfoQuery.getAll(req, res);
})
module.exports = router;
