const express = require('express');
const router  = express.Router();
const ModuleTKBQuery = require('../app/controllers/query/ModuleTKB');
const { route } = require('./api');

router.use('/xem', ModuleTKBQuery.xemTKB);
router.use('/PhanCong/themMonHoc', ModuleTKBQuery.ThemMonHoc);
router.use('/PhanCong/caiDatLopHoc', ModuleTKBQuery.CaiDatLopHoc);
router.use('/PhanCong/thuCong', ModuleTKBQuery.PhanCongThuCong);


module.exports = router;