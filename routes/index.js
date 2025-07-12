var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');


// login
router.get('/', function (req, res, next) {
  res.render('login', {
    failedInfo: req.flash('failedInfo'),
    successInfo: req.flash('successInfo')
  });
});

router.post('/', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      req.flash('failedInfo', 'User does not exist');
      return res.redirect('/');
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      req.flash('failedInfo', 'Password is wrong');
      return res.redirect('/');
    }

    req.session.user = user;
    return res.redirect('dashboard');

  } catch (err) {
    console.error(err);
    req.flash('failedInfo', 'Internal Server Error');
    return res.redirect('/');
  }
});

router.post('/register', async function (req, res, next) {
  try {
    const { email, name, password, role } = req.body;
    console.log(req.body)
    const user = await User.create({ email, name, password, role })
    res.status(201).json(user)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
});

router.get('/logout', function (req, res, next) {
  try {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  } catch (err) {
    console.error(err);
    return res.redirect('/');
  }
});
module.exports = router;

