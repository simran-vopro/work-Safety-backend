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

        // 2. Simplify product structure and add unitPrice (make sure your products have price info)
        const simplifiedProducts = products.map((p) => ({
            productId: p.productId._id,
            code: p.productId.Code,
            description: p.productId.Description,
            image: p.productId["Image Ref"],
            quantity: p.quantity,
            unitPrice: p.productId.UnitPrice || 0,  // <-- Adjust this field name to your schema
        }));

        // Build product rows HTML for email
        const productTableRows = simplifiedProducts.map((p) => `
          <tr>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${p.code}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd;">${p.description}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${p.unitPrice.toFixed(2)}</td>
            <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${(p.unitPrice * p.quantity).toFixed(2)}</td>
          </tr>
        `).join('');

        // Calculate subtotal, VAT, total
        const subtotal = simplifiedProducts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
        const vat = subtotal * 0.20;
        const total = subtotal + vat;

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

        // Plain text version
        const mailText = `
Hi ${fullName},

Thank you for reaching out to us – we’re delighted to support your PPE needs!
Please find below your personalised quote, carefully prepared based on the items you requested:

🛒 Quotation Summary
Product\tDescription\tQty\tUnit Price\tTotal Price
${simplifiedProducts.map(p =>
            `${p.code}\t${p.description}\t${p.quantity}\t£${p.unitPrice.toFixed(2)}\t£${(p.unitPrice * p.quantity).toFixed(2)}`
        ).join('\n')}

Subtotal: £${subtotal.toFixed(2)}
VAT (20%): £${vat.toFixed(2)}
Total Payable: £${total.toFixed(2)}

🛡️ Our Quality Commitment
✅ All products meet the highest UK safety standards
✅ Supplied with Declaration of Conformity (UK)
✅ Products tested and compliant with relevant BS and EN safety norms
✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)

✅ Click below to confirm your order:
👉 Place / Confirm Your Order Now

If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.

We’re committed to helping your business stay safe and compliant—efficiently and affordably.

Best regards,
[Your Full Name]
[Your Role]
[Your Company Name]
📞 [Phone Number]
✉️ [Email Address]
🌐 [Website URL]
`;

        // HTML version
        const mailHtml = `
<p>Hi ${fullName},</p>

<p>Thank you for reaching out to us – we’re delighted to support your PPE needs!<br />
Please find below your personalised quote, carefully prepared based on the items you requested:</p>

<h3>🛒 Quotation Summary</h3>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Total Price</th>
    </tr>
  </thead>
  <tbody>
    ${productTableRows}
  </tbody>
</table>

<p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}<br />
<strong>VAT (20%):</strong> £${vat.toFixed(2)}<br />
<strong>Total Payable:</strong> £${total.toFixed(2)}</p>

<h3>🛡️ Our Quality Commitment</h3>
<ul>
  <li>✅ All products meet the highest UK safety standards</li>
  <li>✅ Supplied with Declaration of Conformity (UK)</li>
  <li>✅ Products tested and compliant with relevant BS and EN safety norms</li>
  <li>✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)</li>
</ul>

<p>✅ Click below to confirm your order:<br />
👉 <a href="YOUR_ORDER_CONFIRMATION_LINK" target="_blank" style="color: #007bff;">Place / Confirm Your Order Now</a></p>

<p>If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.</p>

<p>We’re committed to helping your business stay safe and compliant—efficiently and affordably.</p>

<p>Best regards,<br />
[Your Full Name]<br />
[Your Role]<br />
[Your Company Name]<br />
📞 [Phone Number]<br />
✉️ [Email Address]<br />
🌐 [Website URL]</p>
`;

        let mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: email, // send to customer
            subject: `Your personalised quote - ${subject}`,
            text: mailText,
            html: mailHtml,
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


