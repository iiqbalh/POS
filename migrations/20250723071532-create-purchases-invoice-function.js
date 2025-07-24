'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS purchases_invoice_seq;
    `);

    // Then create the function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION public.purchasesinvoice()
        RETURNS text
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE PARALLEL UNSAFE
      AS $BODY$
        BEGIN
          IF EXISTS (SELECT FROM "Purchases" WHERE invoice = 'INV-' || to_char(current_date, 'YYYYMMDD') || '-1') THEN
            RETURN 'INV-' || to_char(current_date, 'YYYYMMDD') || '-' || nextval('purchases_invoice_seq');
          ELSE
            PERFORM setval('purchases_invoice_seq', 1, false);
            RETURN 'INV-' || to_char(current_date, 'YYYYMMDD') || '-' || nextval('purchases_invoice_seq');
          END IF;
        END;
      $BODY$;
    `);
  },

  async down (queryInterface, Sequelize) {
    // Drop the function in the down migration
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS public.purchasesinvoice();
    `);
    await queryInterface.sequelize.query(`
      DROP SEQUENCE IF EXISTS purchase_invoice_seq;
    `);
  }
};
