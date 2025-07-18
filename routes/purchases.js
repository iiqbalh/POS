var express = require('express');
const { Purchase, Purchaseitem, Good, Supplier, sequelize } = require('../models');
const { Op } = require('sequelize');
const { isLoggedIn, RpInd } = require('../helper/util');
const moment = require('moment');
var router = express.Router();


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


// Get invoice data
router.get('/invoice', async (req, res) => {
    try {
        const today = moment().format('YYYYMMDD');
        const lastInvoice = await Purchase.findOne({
            where: {
                invoice: {
                    [Op.like]: `INV-${today}-%`
                }
            },
            order: [['invoice', 'ASC']]
        });

        let seq = 1;
        if (lastInvoice) {
            const lastSeq = parseInt(lastInvoice.invoice.split('-')[2]);
            seq = lastSeq + 1;
        }

        const invoice = `INV-${today}-${seq}`;
        
        res.json({
            invoice,
            operator: req.session.user.name,
            purchaseitems: []
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
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
    const { invoice, itemcode, quantity, purchaseprice, totalprice, supplier } = req.body;

    // 1. Verify or create the purchase record first
    const [purchase] = await Purchase.findOrCreate({
      where: { invoice },
      defaults: {
        // Include other required purchase fields
        date: new Date(),
        operator: req.session.user.userId, // Modify as needed
        supplier: supplier,
        totalsum: 0 // Will be updated by trigger
      }
    });

    // 2. Check if goods exists
    const goods = await Good.findOne({ where: { barcode: itemcode } });
    if (!goods) {
      return res.status(404).json({ error: 'Goods not found' });
    }

    // 3. Create purchase item
    const item = await Purchaseitem.create({
      invoice,
      itemcode,
      quantity,
      purchaseprice,
      totalprice
    });

    res.json(item);
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
            supplierId,
            totalsum,
            operator: req.session.user.name
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error completing purchase:', error);
        res.status(500).json({ error: 'Failed to complete purchase' });
    }
});

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


    //invoice
    const today = moment().format('YYYYMMDD');
    const lastInvoice = await Purchase.findOne({
      where: {
        invoice: {
          [Op.like]: `INV-${today}-%`
        }
      },
      order: [['invoice', 'ASC']]
    });

    let seq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoice.split('-')[2]);
      seq = lastSeq + 1;
    }

    const inv = `INV-${today}-${seq}`;
    const dataPurchases = await Purchase.findAll(params);
    const dataPurchaseItems = await Purchaseitem.findAll();

    res.status(200).json(
      {
        purchases: dataPurchases,
        purchaseitems: dataPurchaseItems,
        invoice: inv,
        sortBy,
        sortMode,
        limit,
        offset,
        count,
        pages
      });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message })
  }
});

// router.post('/add', isLoggedIn, async function (req, res, next) {
//   try {
//     const { invoice, time, operator, totalsum, supplier, itemcode, quantity, purchaseprice, totalprice } = req.body;

//     console.log('purchases', req.body)

//     //const purchases = await Purchase.create({ invoice, time, operator, totalsum, supplier });
//     //const purchaseitems = await Purchaseitem.create({ invoice, itemcode, quantity, purchaseprice, totalprice });

//     res.status(201).json({
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