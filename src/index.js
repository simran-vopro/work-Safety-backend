const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("short"));

// DB connect
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});



// Static files (for images, etc.)
app.use('/static', express.static(path.join(__dirname, '../public')));

// Serve files in public
app.use("/static/topBanners", express.static(path.join(__dirname, "../public/topBanners")));

// API Routes
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/categories', categoryRoutes);
app.use('/api', productRoutes);
app.use('/api/banner', bannerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);



// Serve frontend (Vite build)
const frontendPath = path.join(__dirname, '../frontend', 'dist');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


// Catch-all: for SPA routes, serve index.html
try {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} catch (err) {
  console.error('Error registering wildcard route:', err.message);
}

