const bcrypt = require('bcryptjs');

// Replace 'yourpassword' with the password you want for your admin
const password = 'adminpass';

bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});