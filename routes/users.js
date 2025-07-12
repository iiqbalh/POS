var express = require('express');
var router = express.Router();
const { User } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn } = require('../helper/util');

/* GET users listing. */
router.get('/', isLoggedIn, async function (req, res, next) {
  try {
    let { page = 1, query = '', sortBy = 'userId', sortMode = 'asc', limit = 3 } = req.query
    const url = req.url == '/' ? `/?page=${page}&sortBy=${sortBy}&sortMode=${sortMode}` : req.url;

    const params = {};

    //searching
    if (query) {
      params['where'] = {
        ...params.where,
        [Op.or]: [
        { email: { [Op.iLike]: `%${query}%` } },
        { name: { [Op.iLike]: `%${query}%` } },
      ]
      }
    }

    //pagination
    limit = Number(limit)
    const offset = limit * (page - 1);
    const count = await User.count(params);
    const pages = Math.ceil(count / limit)

    //sorting
    params['order'] = [
      [sortBy, sortMode == 'asc' ? 'ASC' : 'DESC']
    ]

    params['limit'] = limit
    params['offset'] = offset

    const users = await User.findAll(params);
    // res.status(200).json(users[0], page, pages, limit, offset)
    res.render('users/list', {
      data: users,
      title: 'users',
      name: req.session.name,
      search: query,
      page,
      count,
      pages,
      sortBy,
      sortMode,
      offset,
      limit,
      url
    });
  } catch (e) {
    console.log(e);
  }
});

router.get('/add', isLoggedIn, async function (req, res, next) {
  try {
    res.render('users/add');
  } catch (e) {
    console.log(e);
  }
});

router.post('/add', isLoggedIn, async function (req, res, next) {
  try {
    const { email, name, password, role } = req.body;
    const user = await User.create({ email, name, password, role })
    res.redirect('/users');
  } catch (e) {
    console.log(e);
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      console.log('User not found');
    }

    res.render('users/edit', {
      data: user
    });
  } catch (err) {
    console.error(err);
  }
});

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { email, name, role } = req.body;
    const { id } = req.params;
    console.log(email, name, role, id)

    const [updatedRows] = await User.update({ email, name, role }, { where: { userId: id } });

    if (updatedRows === 0) {
      console.log('error', 'User not found');
    } else {
      console.log('success', 'User updated successfully');
    }

    res.redirect('/users');

  } catch (err) {
    console.error(err);
    res.redirect('/users');
  }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const id = req.params.id;
    
    await User.destroy({
      where: {
        userId: id
      }
    });
    
    res.redirect('/users');
  } catch (err) {
    console.error('Error deleting user:', err);
    next(err);
  }
});

module.exports = router;
