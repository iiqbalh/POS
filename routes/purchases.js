var express = require('express');
const { Purchase, Purchaseitem, Good, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn, RpInd } = require('../helper/util');
const moment = require('moment');
var router = express.Router();


//form
// router.get('/add', isLoggedIn, async function (req, res, next) {
//   const goods = await Good.findAll();
//   const suppliers = await Supplier.findAll();
//   const purchases = await Purchase.findAll();

//   res.render('purchases/form', {
//     title: 'Purchases',
//     goods,
//     good: {},
//     suppliers,
//     purchases,
//     purchaseitem: {},
//     name: req.session.user.name,
//     moment
//   })
// });


// Get invoice data
// router.get('/invoice', async (req, res) => {
//   try {
//     const today = moment().format('YYYYMMDD');
//     const lastInvoice = await Purchase.findOne({
//       where: {
//         invoice: {
//           [Op.like]: `INV-${today}-%`
//         }
//       },
//       order: [['invoice', 'ASC']]
//     });

//     let seq = 1;
//     if (lastInvoice) {
//       const lastSeq = parseInt(lastInvoice.invoice.split('-')[2]);
//       lastSeq + seq++;
//     }

//     const invoice = `INV-${today}-${seq}`;

//     // Get existing items with goods names
//     const purchaseitems = await Purchaseitem.findAll({
//       where: { invoice },
//       include: [{
//         model: Good,
//         attributes: ['name']
//       }]
//     });

//     res.json({
//       seq,
//       invoice,
//       operator: req.session.user.name,
//       purchaseitems: purchaseitems.map(item => ({
//         ...item.toJSON(),
//         name: item.Good.name
//       }))
//     });
//   } catch (error) {
//     console.error('Error generating invoice:', error);
//     res.status(500).json({ error: 'Failed to generate invoice' });
//   }
// });

router.get('/add', isLoggedIn, async (req, res) => {
  try {
    // Create a new purchase with auto-generated invoice
    const newPurchase = await Purchase.create({
      operator: req.session.user.userId, // assuming you have user auth
      totalsum: 0 // initial total
    });

    // Redirect to edit page with the new invoice number
    res.redirect(`/purchases/edit/${newPurchase.invoice}`);
    
  } catch (error) {
    console.error('Error creating new purchase:', error);
    res.redirect('/purchases?error=Failed to create new purchase');
  }
});

router.get('/edit/:invoice', isLoggedIn, async (req, res, next) => {
  try {
    const purchase = await Purchase.findOne({
      where: { invoice: req.params.invoice },
      include: [
        {
          model: Purchaseitem,
          include: [
            {
              model: Good
            }
          ]
        }
      ]
    });

    console.log(purchase.invoice)

    const supplier = await Supplier.findAll()

    const good = await Good.findAll()

    res.render('purchases/form', {
      purchases: purchase,
      good: purchase.Purchaseitems[0].Good,
      purchaseitem: purchase.Purchaseitems,
      suppliers: supplier,
      goods: good,
      name: req.session.user.name,
      moment
    });
  } catch (err) {
    console.error(err);
  }
});

router.post('/edit/:invoice', isLoggedIn, async (req, res, next) => {
  try {
    const { itemcode, quantity, purchaseprice, totalprice } = req.body;

    console.log(req.params.invoice, req.body)

    const [updatedRows] = await Purchaseitem.create({
      invoice,
      itemcode,
      quantity,
      purchaseprice,
      totalprice
    },
      {
        where: { invoice: req.params.invoice }
      });
    res.json(updatedRows);
  } catch (err) {
    console.error(err);
    res.redirect('/purchases');
  }
});

//Get goods by barcode
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
router.post('/items/add', async (req, res) => {
  try {
    const { invoice, itemcode, quantity, purchaseprice, totalprice } = req.body;


    const [purchase] = await Purchase.findOrCreate({
      where: { invoice },
      defaults: {
        date: new Date(),
        operator: req.session.user.userId
      }
    });


    const goods = await Good.findOne({ where: { barcode: itemcode } });
    if (!goods) {
      return res.status(404).json({ error: 'Goods not found' });
    }


    const item = await Purchaseitem.create({
      invoice,
      itemcode,
      quantity,
      purchaseprice,
      totalprice
    });

    res.json({
      id: item.id,
      invoice: item.invoice,
      itemcode: item.itemcode,
      name: goods.name,
      quantity: item.quantity,
      purchaseprice: item.purchaseprice,
      totalprice: item.totalprice
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Failed to add item',
      details: error.message
    });
  }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;


    const item = await Purchaseitem.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }


    await Purchaseitem.destroy({ where: { id } });


    await Good.update(
      { stock: sequelize.literal(`stock - ${item.quantity}`) },
      { where: { barcode: item.itemcode } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Complete purchase
router.post('/finish', async (req, res) => {
  try {
    const { invoice, supplierId, totalsum } = req.body;


    await Purchase.upsert({
      invoice,
      supplier: Number(supplierId),
      totalsum,
      operator: req.session.user.userId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing purchase:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

//list
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


    const dataPurchases = await Purchase.findAll({
      params,
      include: [
        {
          model: Supplier
        }
      ]
    });
    res.render('purchases/list', { title: 'Purchases', dataPurchases, moment, RpInd })
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message })
  }
});

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