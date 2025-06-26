var express = require('express');
var router = express.Router();
const { Good } = require('../models');
const { Unit } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn, RpInd } = require('../helper/util');
const path = require('path');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    let { page = 1, query = '', sortBy = 'barcode', sortMode = 'asc', limit = 3 } = req.query
    const url = req.url == '/' ? `/?page=${page}&sortBy=${sortBy}&sortMode=${sortMode}` : req.url;

    const params = {};

    // //searching
    if (query) {
      params['where'] = {
        ...params.where,
        [Op.or]: [
          { barcode: { [Op.iLike]: `%${query}%` } },
          { name: { [Op.iLike]: `%${query}%` } },
        ]
      }
    }

    // //pagination
    limit = Number(limit)
    const offset = limit * (page - 1);
    const count = await Good.count(params);
    const pages = Math.ceil(count / limit)

    //sorting
    params['order'] = [
      [sortBy, sortMode == 'asc' ? 'ASC' : 'DESC']
    ]

    params['limit'] = limit
    params['offset'] = offset

    const good = await Good.findAll(params);
    // res.status(200).json(users[0], page, pages, limit, offset)
    res.render('goods/list', {
      data: good,
      title: 'goods',
      name: req.session.name,
      search: query,
      page,
      count,
      pages,
      sortBy,
      sortMode,
      offset,
      limit,
      url,
      RpInd
    });
  } catch (e) {
    console.log(e);
  }
});

router.get('/add', isLoggedIn, async function (req, res, next) {
  try {
    const unit = await Unit.findAll();
    res.render('goods/form', { data: {}, title: 'Form add', unit });
  } catch (e) {
    console.log(e);
  }
});

router.post('/add', isLoggedIn, async function (req, res, next) {
  try {
    const { barcode, name, stock, purchaseprice, sellingprice, unit } = req.body;

    if (!req.files || Object.keys(req.files).length === 0) {
      console.log('No files were uploaded.');
    }

    const filePicture = req.files.picture;
    const fileName = `${Date.now()}-${filePicture.name}`
    const uploadPath = path.join(__dirname, '..', 'public', 'images', 'pictures', fileName);

    await filePicture.mv(uploadPath)

    Good.create({
      barcode,
      name,
      stock,
      purchaseprice,
      sellingprice,
      unit,
      picture: fileName
    });

    res.redirect('/goods');
  } catch (e) {
    console.log(e);
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const good = await Good.findByPk(req.params.id);
    const unit = await Unit.findAll();

    if (!good) {
      console.log('User not found');
    }

    res.render('goods/form', {
      title: 'Form edit',
      data: good,
      unit
    });
  } catch (err) {
    console.error(err);
  }
});

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { barcode, name, stock, purchaseprice, sellingprice, unit, picture } = req.body;
    const { id } = req.params;

    let fileName = picture;

     if (req.files && req.files.picture) {
      const filePicture = req.files.picture;
      fileName = `${Date.now()}-${filePicture.name}`;
      const uploadPath = path.join(__dirname, '..', 'public', 'images', 'pictures', fileName);
      
      await filePicture.mv(uploadPath);
    }

    const [updatedRows] = await Good.update({
      barcode,
      name,
      stock,
      purchaseprice,
      sellingprice,
      unit,
      picture: fileName
    },
      { where: { barcode: id } });

    if (updatedRows === 0) {
      console.log('error, Good not found');
    } else {
      console.log('success, Good updated successfully');
    }

    res.redirect('/goods');

  } catch (err) {
    console.error(err);
    res.redirect('/goods');
  }
});

router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const id = req.params.id;

    await Good.destroy({
      where: {
        barcode: id
      }
    });

    res.redirect('/goods');
  } catch (err) {
    console.error('Error deleting user:', err);
    next(err);
  }
});

module.exports = router;