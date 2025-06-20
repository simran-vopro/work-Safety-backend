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

console.log('Running from directory:', __dirname);


// Static assets
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use('/static/topBanners', express.static(path.join(__dirname, '../public/topBanners')));

// API Routes (wrapped in try-catch)
try {
  app.use('/api/categories', require('./routes/categoryRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load categoryRoutes:', err.message);
}

try {
  app.use('/api/products', require('./routes/productRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load productRoutes:', err.message);
}

try {
  app.use('/api/banner', require('./routes/bannerRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load bannerRoutes:', err.message);
}

try {
  app.use('/api/cart', require('./routes/cartRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load cartRoutes:', err.message);
}

try {
  app.use('/api/order', require('./routes/orderRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load orderRoutes:', err.message);
}

try {
  app.use('/api/query', require('./routes/queryRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load queryRoutes:', err.message);
}

try {
  app.use('/api/auth', require('./routes/authRoutes.js'));
} catch (err) {
  console.error('❌ Failed to load authRoutes:', err.message);
}

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
