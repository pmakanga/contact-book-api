const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

// Encrypt data before storing it
const encrypt = (data, secretKey) => {
  const iv = crypto.randomBytes(16); // Generate a random IV
  const key = Buffer.from(secretKey, 'hex'); // Convert the hex string to a Buffer
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

// Decrypt data when retrieving it
const decrypt = (data, secretKey) => {
  const iv = Buffer.from(data.slice(0, 32), 'hex'); // Extract IV from the encrypted data
  const encryptedData = data.slice(32); // Extract the actual encrypted data
  const key = Buffer.from(secretKey, 'hex'); // Convert the hex string to a Buffer
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};


// Create a new contact
app.post('/contacts', (req, res) => {
  const { name, phone } = req.body;
  const secretKey = '52ae94c251d3a14c961c2a163cf27ece0f40efed17560fc6605ccdc7a5e17d03';

  const encryptedName = encrypt(name, secretKey);
  const encryptedPhone = encrypt(phone, secretKey);

  db.run('INSERT INTO contacts (name, phone) VALUES (?, ?)', [encryptedName, encryptedPhone], (err) => {
      if (err) {
          console.log(err);
          return res.status(500).json({ error: 'Failed to create contact' });
      }
      res.json({ message: 'Contact created successfully' });
  });
});


// Fetch all contacts

app.get('/contacts', (req, res) => {
  const secretKey = '52ae94c251d3a14c961c2a163cf27ece0f40efed17560fc6605ccdc7a5e17d03';

  db.all('SELECT id, name, phone FROM contacts', (err, rows) => {
      if (err) {
          console.log(err.message);
          return res.status(500).json({ error: 'Failed to fetch contacts' });
      }

      const contacts = rows.map((row) => {
          let contact = { id: row.id };
          if (row.name) {
              const decryptedName = decrypt(row.name, secretKey);
              const decryptedPhone = decrypt(row.phone, secretKey);

              contact.name = decryptedName;
              contact.phone = decryptedPhone;
          }
          return contact;
      });
      res.json(contacts);
  });
});


// Update a contact
app.put('/contacts/:id', (req, res) => {
  const { name, phone } = req.body;
  const id = req.params.id;
  const secretKey = '52ae94c251d3a14c961c2a163cf27ece0f40efed17560fc6605ccdc7a5e17d03';

  // Encrypt name and phone separately
  const encryptedName = encrypt(name, secretKey);
  const encryptedPhone = encrypt(phone, secretKey);

  db.run('UPDATE contacts SET name = ?, phone = ? WHERE id = ?', [encryptedName, encryptedPhone, id], (err) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ error: 'Failed to update contact' });
    }
    res.json({ message: 'Contact updated successfully' });
  });
});

// Delete a contact
app.delete('/contacts/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM contacts WHERE id = ?', id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete contact' });
    }
    res.json({ message: 'Contact deleted successfully' });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


