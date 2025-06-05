const Order = require('../models/Order');
const Cart = require('../models/Cart');
const nodemailer = require('nodemailer');


// Compare cart items with products sent in request
const areSameProducts = (cartItems, requestProducts) => {
    if (cartItems.length !== requestProducts.length) return false;

    const cartMap = new Map();
    cartItems.forEach((item) => {
        cartMap.set(item.productId._id.toString(), item.quantity);
    });

    for (const p of requestProducts) {
        const id = typeof p.productId === 'string' ? p.productId : p.productId._id;
        const quantity = p.quantity;
        if (!cartMap.has(id.toString()) || cartMap.get(id.toString()) !== quantity) {
            return false;
        }
    }

    return true;
};

exports.requestQuote = async (req, res) => {
    const {
        fullName,
        address,
        address2,
        city,
        postcode,
        company,
        subject,
        text,
        email,
        sessionId,
        products,
    } = req.body;

    if (!email || !subject || !text || !products || !sessionId || !fullName || !address) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Find the user's cart (optional check)
        const cart = await Cart.findOne({ sessionId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Compare cart and incoming products
        if (!areSameProducts(cart.items, products)) {
            return res.status(400).json({ message: 'Cart items do not match the requested products' });
        }

        // 2. Simplify product structure
        const simplifiedProducts = products.map((p) => ({
            productId: p.productId._id,
            code: p.productId.Code,
            description: p.productId.Description,
            image: p.productId["Image Ref"],
            quantity: p.quantity,
        }));

        // 3. Save the order
        const newOrder = await Order.create({
            email,
            fullName,
            address,
            address2,
            city,
            postcode,
            company,
            sessionId,
            message: text,
            products: simplifiedProducts,
        });

        // 4. Email Setup
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_PORT == '465',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const productList = simplifiedProducts.map((p, i) => (
            `${i + 1}. ${p.code} - ${p.description} (Qty: ${p.quantity})`
        )).join('\n');

        let mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: 'sktech@vopro.in',
            subject,
            text: `
${text}

Customer Information:
Name: ${fullName}
Email: ${email}
Address: ${address}${address2 ? ', ' + address2 : ''}

Session ID: ${sessionId}

Ordered Products:
${productList}
      `.trim(),
        };

        const info = await transporter.sendMail(mailOptions);

        // 5. (Optional) Clear cart
        await Cart.deleteOne({ sessionId });

        return res.status(200).json({
            message: 'Quote requested successfully',
            order: newOrder,
            mailInfo: info.response,
        });
    } catch (error) {
        console.error('Quote request error:', error);
        return res.status(500).json({ error: 'Failed to send request' });
    }
};
