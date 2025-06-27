var express = require('express');
const { Supplier } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn } = require('../helper/util');
var router = express.Router();


router.get('/', isLoggedIn, async function (req, res, next) {
    try{
  let { page = 1, query = '', sortBy = 'supplierId', sortMode = 'asc', limit = 3 } = req.query
  const url = req.url == '/' ? `/?page=${page}&sortBy=${sortBy}&sortMode=${sortMode}` : req.url;

  const params = {};

  //searching
  if (query) {
    params['where'] = {
      ...params.where,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { address: { [Op.iLike]: `%${query}%` } },
        { phonecharacter: { [Op.iLike]: `%${query}%` } }
      ]
    };
  }

  //pagination
  limit = Number(limit)
  const offset = limit * (page - 1);
  const count = await Supplier.count(params);
  const pages = Math.ceil(count / limit)

  //sorting
  params['order'] = [
    [sortBy, sortMode == 'asc' ? 'ASC' : 'DESC']
  ]

  params['limit'] = limit
  params['offset'] = offset

  const suppliers = await Supplier.findAll(params);
  // res.status(200).json(units[0], page, pages, limit, offset)
  res.render('suppliers/list', {
    data: suppliers,
    title: 'suppliers',
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
    res.render('suppliers/form', { data: {} });
  } catch (e) {
    console.log(e);
  }
});

router.post('/add', isLoggedIn, async function (req, res, next) {
  try {
    const { name, address, phonecharacter  } = req.body;
    const data = await Supplier.create({ name, address, phonecharacter  })
    res.redirect('/suppliers');
  } catch (e) {
    console.log(e);
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);

    if (!supplier) {
      console.log('Supplier not found');
    }

    res.render('suppliers/form', {
      data: supplier
    });
  } catch (err) {
    console.error(err);
  }
});

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { name, address, phonecharacter } = req.body;
    const { id } = req.params;

    const [updatedRows] = await Supplier.update({ name, address, phonecharacter }, { where: { supplierId: id } });

    if (updatedRows === 0) {
      console.log('error', 'Supplier not found');
    } else {
      console.log('success', 'Supplier updated successfully');
    }

    res.redirect('/suppliers');

  } catch (err) {
    console.error(err);
    res.redirect('/suppliers');
  }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const supplierId = req.params.id;

    await Supplier.destroy({
      where: {
        unit: supplierId
      }
    });

    res.redirect('/suppliers');
  } catch (err) {
    console.error('Error deleting unit:', err);
    next(err);
  }
});

module.exports = router;