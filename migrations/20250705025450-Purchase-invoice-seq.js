'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Create a sequence tracking table
    await queryInterface.createTable('Purchases_invoice_sequences', {
      date: {
        type: Sequelize.DATEONLY,
        primaryKey: true,
        allowNull: false
      },
      last_number: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Step 2: Create a function to generate the invoice number
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION generate_invoice_number()
      RETURNS TRIGGER AS $$
      DECLARE
        current_date DATE := CURRENT_DATE;
        last_num INTEGER;
        new_num INTEGER;
      BEGIN
        -- Get the last sequence number for today
        SELECT last_number INTO last_num 
        FROM invoice_sequences 
        WHERE date = current_date;
        
        -- If no entry exists or it's a new day, start at 1
        IF last_num IS NULL THEN
          new_num := 1;
          INSERT INTO invoice_sequences (date, last_number, createdAt, updatedAt)
          VALUES (current_date, new_num, NOW(), NOW());
        ELSE
          -- Increment the sequence
          new_num := last_num + 1;
          UPDATE invoice_sequences 
          SET last_number = new_num, updatedAt = NOW()
          WHERE date = current_date;
        END IF;
        
        -- Format the invoice number
        NEW.invoice_number := 'INV-' || TO_CHAR(current_date, 'YYYYMMDD') || '-' || new_num;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Step 3: Create the trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER set_invoice_number
      BEFORE INSERT ON invoices
      FOR EACH ROW
      WHEN (NEW.invoice_number IS NULL)
      EXECUTE FUNCTION generate_invoice_number();
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the trigger and function
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
    `);
    
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS generate_invoice_number();
    `);
    
    // Drop the sequence tracking table
    await queryInterface.dropTable('invoice_sequences');
  }
};
