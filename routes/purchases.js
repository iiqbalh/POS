var express = require('express');
const { Purchase, Purchaseitem, Good, Supplier } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn, RpInd } = require('../helper/util');
const moment = require('moment');
var router = express.Router();


//list
router.get('/', function (req, res, next) {
  res.render('purchases/list', { title: 'Purchases' })
});

router.get('/', isLoggedIn, async function (req, res, next) {
  try {
    let { page = 1, query = '', sortBy = 'invoice', sortMode = 'asc', limit = 3 } = req.query

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

    // //pagination
    limit = Number(limit)
    const offset = limit * (page - 1);
    const count = await Purchase.count(params);
    const pages = Math.ceil(count / limit)

    // //sorting
    params['order'] = [
      [sortBy, sortMode == 'asc' ? 'ASC' : 'DESC']
    ]

    params['limit'] = limit
    params['offset'] = offset

    const purchases = await Purchase.findAll(params);
    res.status(200).json(
      {
        data: purchases,
        sortBy,
        sortMode,
        limit,
        offset,
        count,
        pages
      })
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message })
  }
});

//form
router.get('/add', isLoggedIn, async function (req, res, next) {
  const goods = await Good.findAll();
  const suppliers = await Supplier.findAll();
  const purchases = await Purchase.findAll();
  const purchaseitems = await Purchaseitem.findAll();
  res.render('purchases/form', {
    title: 'Purchases',
    data: {},
    goods,
    suppliers,
    purchases,
    purchaseitems,
    name: req.session.user.name,
    RpInd
  })
});


// Generate invoice number
router.get('/generate-invoice', async (req, res) => {
  try {
    const today = moment().format('YYYYMMDD');
    const lastInvoice = await Purchase.findOne({
      where: {
        invoice: {
          [Op.like]: `INV-${today}-%`
        }
      },
      order: [['invoice', 'DESC']]
    });

    let seq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoice.split('-')[2]);
      seq = lastSeq + 1;
    }

    const invoice = `INV-${today}-${seq}`;
    res.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Get goods by barcode
router.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const goods = await Good.findOne({
      where: { barcode }
    });

    if (!goods) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    res.json(goods);
  } catch (error) {
    console.error('Error fetching goods:', error);
    res.status(500).json({ error: 'Failed to fetch goods' });
  }
});

// Add item to purchase
router.post('/:invoice/items', async (req, res) => {
  try {
    const { invoice } = req.params;
    const { itemcode, quantity } = req.body;

    // Check if purchase exists or create new
    let purchase = await Purchase.findOne({ where: { invoice } });
    if (!purchase) {
      purchase = await Purchase.create({
        invoice,
        operator: req.session.user.name
      });
    }

    // Get goods details
    const goods = await Good.findOne({ where: { barcode: itemcode } });
    if (!goods) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    // Calculate prices
    const purchaseprice = goods.purchaseprice;
    const totalprice = purchaseprice * quantity;

    // Create purchase item
    const item = await Purchaseitem.create({
      invoice,
      itemcode,
      quantity,
      purchaseprice,
      totalprice
    });

    // Update goods stock
    await Good.update(
      { stock: sequelize.literal(`stock + ${quantity}`) },
      { where: { barcode: itemcode } }
    );

    // Update purchase total
    const items = await Purchaseitem.findAll({
      where: { invoice },
      attributes: [
        [sequelize.fn('sum', sequelize.col('totalprice')), 'total']
      ],
      raw: true
    });

    await Purchase.update(
      { totalsum: items[0].total || 0 },
      { where: { invoice } }
    );

    res.json(item);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Complete purchase
router.patch('/:invoice', async (req, res) => {
  try {
    const { invoice } = req.params;
    const { supplierId } = req.body;

    await Purchase.update(
      { supplierId },
      { where: { invoice } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// router.post('/add', isLoggedIn, async function (req, res, next) {
//   try {
//     const { invoice, time, operator, totalsum, supplier, itemcode, quantity, purchaseprice, totalprice } = req.body;

//     console.log('purchases', req.body)

//     // const purchases = await Purchase.create({ invoice, time, operator, totalsum, supplier });
//     // const purchaseitems = await Purchaseitem.create({ invoice, itemcode, quantity, purchaseprice, totalprice });
//     console.log(req.body)

//     res.status(201).json({
//       dataPurchase: purchases,
//       dataPurchaseitem: purchaseitems
//     });
//   } catch (e) {
//     console.log(e);
//   }
// });

// router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
//   try {
//     const Purchase = await Purchase.findByPk(req.params.id);

//     if (!Purchase) {
//       console.log('Purchase not found');
//     }

//     res.render('purchases/form', {
//       data: Purchase
//     });
//   } catch (err) {
//     console.error(err);
//   }
// });

// router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
//   try {
//     const { name, address, phonecharacter } = req.body;
//     const { id } = req.params;

//     const [updatedRows] = await Purchase.update({ name, address, phonecharacter }, { where: { PurchaseId: id } });

//     if (updatedRows === 0) {
//       console.log('error', 'Purchase not found');
//     } else {
//       console.log('success', 'Purchase updated successfully');
//     }

//     res.redirect('/purchases');

//   } catch (err) {
//     console.error(err);
//     res.redirect('/purchases');
//   }
// });

// router.get('/delete/:id', isLoggedIn, async (req, res, next) => {
//   try {
//     const PurchaseId = req.params.id;

//     await Purchase.destroy({
//       where: {
//         unit: PurchaseId
//       }
//     });

//     res.redirect('/purchases');
//   } catch (err) {
//     console.error('Error deleting unit:', err);
//     next(err);
//   }
// });

module.exports = router;