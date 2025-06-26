var express = require('express');
// const {  } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn } = require('../helper/util');
var router = express.Router();


router.get('/', isLoggedIn, function (req, res, next) {
  res.render('dashboard', { title: 'dashboard' });
});

module.exports = router;

