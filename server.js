const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root (so HTML Pages folder is reachable)
app.use(express.static(path.join(__dirname)));

// Simple mock credentials
const MOCK_USER = {
  email: 'test@example.com',
  password: 'password123'
};

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  if (email === MOCK_USER.email && password === MOCK_USER.password) {
    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.listen(port, () => {
  console.log(`Mock auth server running at http://localhost:${port}`);
});