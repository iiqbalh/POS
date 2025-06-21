var express = require('express');
var router = express.Router();
const { User } = require('../models');
const { isLoggedIn } = require('../helper/util');

/* GET users listing. */
router.get('/', isLoggedIn, async function (req, res, next) {
  try {
    const users = await User.findAll();
    // res.status(200).json(users[0])
    res.render('users', {
      title: 'users',
      name: req.session.name
    });
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
});


module.exports = router;
