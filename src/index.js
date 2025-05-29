const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// DB connect
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });


// Middleware
app.use(cors());
app.use(express.json());

console.log(__dirname)

// Static files (for images, etc.)
app.use('/static', express.static(path.join(__dirname, '../public')));

// API Routes
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
app.use('/api/categories', categoryRoutes);
app.use('/api', productRoutes);

// Serve frontend (Vite build)
const frontendPath = path.join(__dirname, '../frontend', 'dist');
app.use(express.static(frontendPath));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontendPath', 'index.html'));
});

// Wildcard route for SPA (must come **after** all other routes)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });


