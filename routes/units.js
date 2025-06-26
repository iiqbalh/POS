var express = require('express');
const { Unit } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn } = require('../helper/util');
var router = express.Router();


router.get('/', isLoggedIn, async function (req, res, next) {
    try{
  let { page = 1, query = '', sortBy = 'unit', sortMode = 'asc', limit = 3 } = req.query
  const url = req.url == '/' ? `/?page=${page}&sortBy=${sortBy}&sortMode=${sortMode}` : req.url;

  const params = {};

  //searching
  if (query) {
    params['where'] = {
      ...params.where,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { unit: { [Op.iLike]: `%${query}%` } },
        { note: { [Op.iLike]: `%${query}%` } }
      ]
    };
  }

  //pagination
  limit = Number(limit)
  const offset = limit * (page - 1);
  const count = await Unit.count(params);
  const pages = Math.ceil(count / limit)

  //sorting
  params['order'] = [
    [sortBy, sortMode == 'asc' ? 'ASC' : 'DESC']
  ]

  params['limit'] = limit
  params['offset'] = offset

  const units = await Unit.findAll(params);
  // res.status(200).json(units[0], page, pages, limit, offset)
  res.render('units/list', {
    data: units,
    title: 'units',
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
} catch(e) {
    console.log(e);
}
});

router.get('/add', isLoggedIn, async function (req, res, next) {
  try {
    
    res.render('units/form', { data: {} });
  } catch (e) {
    console.log(e);
  }
});

router.post('/add', isLoggedIn, async function (req, res, next) {
  try {
    const { unit, name, note } = req.body;
    const data = await Unit.create({ unit, name, note })
    res.redirect('/units');
  } catch (e) {
    console.log(e);
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      console.log('Unit not found');
    }

    res.render('units/form', {
      data: unit
    });
  } catch (err) {
    console.error(err);
  }
});

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { unit, name, note } = req.body;
    const { id } = req.params;

    const [updatedRows] = await Unit.update({ unit, name, note }, { where: { unit: id } });

    if (updatedRows === 0) {
      console.log('error', 'Unit not found');
    } else {
      console.log('success', 'Unit updated successfully');
    }

    res.redirect('/units');

  } catch (err) {
    console.error(err);
    res.redirect('/units');
  }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const unit = req.params.id;

    await Unit.destroy({
      where: {
        unit: unit
      }
    });

    res.redirect('/units');
  } catch (err) {
    console.error('Error deleting unit:', err);
    next(err);
  }
});

module.exports = router;