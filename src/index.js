const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("short"));

// DB connect
mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Static assets
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/static/topBanners', express.static(path.join(__dirname, '../public/topBanners')));

// API Routes
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/banner', require('./routes/bannerRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));
app.use('/api/query', require('./routes/queryRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Serve frontend and admin (Vite build)
const frontendPath = path.join(__dirname, '../frontend/dist');
const adminPath = path.join(__dirname, '../admin/dist');

// Serve static files
app.use('/', express.static(frontendPath));
app.use('/admin', express.static(adminPath));

// Redirect `/admin` to `/admin/` to avoid path issues
app.get('/admin', (req, res) => {
  res.redirect('/admin/');
});

// Fallback for admin SPA
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Fallback for frontend SPA
app.get(/^\/(?!admin).*$/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
