const Order = require("../models/Order");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");
const { nanoid } = require("nanoid");
const { frontendUrl } = require("../utils/config");

// Compare cart items with products sent in request
const areSameProducts = (cartItems, requestProducts) => {
  if (cartItems.length !== requestProducts.length) return false;

  const cartMap = new Map();
  cartItems.forEach((item) => {
    cartMap.set(item.productId._id.toString(), item.quantity);
  });

  for (const p of requestProducts) {
    const id = typeof p.productId === "string" ? p.productId : p.productId._id;
    const quantity = p.quantity;
    if (
      !cartMap.has(id.toString()) ||
      cartMap.get(id.toString()) !== quantity
    ) {
      return false;
    }
  }

  return true;
};

exports.requestQuote = async (req, res) => {
  const {
    firstName,
    lastName,
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

  if (
    !email ||
    !subject ||
    !text ||
    !products ||
    !sessionId ||
    !firstName ||
    !lastName ||
    !address
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const fullName = `${firstName} ${lastName}`;

  try {
    const cart = await Cart.findOne({ sessionId }).populate("items.productId");

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    if (!areSameProducts(cart.items, products)) {
      return res
        .status(400)
        .json({ message: "Cart items do not match the requested products" });
    }

    const simplifiedProducts = products.map((p) => ({
      productId: p.productId._id,
      code: p.productId.Code,
      description: p.productId.Description,
      image: p.productId["Image Ref"],
      quantity: p.quantity,
      unitPrice: p.productId.UnitPrice || 0,
    }));

    const productTableRows = simplifiedProducts
      .map(
        (p) => `
  <tr>
    <td style="padding: 4px 8px; border: 1px solid #ddd;">
      <a href="${frontendUrl}/projectDetails/${p.productId}" target="_blank" style="color: #007bff; text-decoration: none;">
        ${p.code}
      </a>
    </td>
    <td style="padding: 4px 8px; border: 1px solid #ddd;">
      <a href="https://work-safety-backend.onrender.com/projectDetails/${
        p.productId
      }" target="_blank" style="color: #007bff; text-decoration: none;">
        ${p.description}
      </a>
    </td>
    <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">${
      p.quantity
    }</td>
    <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${p.unitPrice.toFixed(
      2
    )}</td>
    <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${(
      p.unitPrice * p.quantity
    ).toFixed(2)}</td>
  </tr>
`
      )
      .join("");

    const subtotal = simplifiedProducts.reduce(
      (sum, p) => sum + p.unitPrice * p.quantity,
      0
    );
    const vat = subtotal * 0.2;
    const total = subtotal + vat;
    const orderId = "ORD-" + nanoid(8);

    const newOrder = await Order.create({
      orderId,
      email,
      firstName,
      lastName,
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

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == "465",
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailHtml = `
<p>Hi ${firstName},</p>

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
👉 <a href="https://work-safety-backend.onrender.com/confirm-order/${orderId}" target="_blank" style="color: #007bff;">
  Place / Confirm Your Order Now
</a>
</p>

<p>If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.</p>

<p>We’re committed to helping your business stay safe and compliant—efficiently and affordably.</p>

<p>Best regards,<br />
[Your Full Name]<br />
[Your Role]<br />
Work Wear Pvt. Ltd.<br />
📞 xxxxxxxxx<br />
✉️ hello@workwearcompany.co.uk<br />
🌐 workwearcompany.co.uk</p>
`;

    let mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: `Your personalised quote - ${subject}`,
      html: mailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    await Cart.deleteOne({ sessionId });

    return res.status(200).json({
      message: "Quote requested successfully",
      order: newOrder,
      mailInfo: info.response,
    });
  } catch (error) {
    console.error("Quote request error:", error);
    return res.status(500).json({ error: "Failed to send request" });
  }
};

exports.getOrder = async (req, res) => {
  const { orderId } = req.params;
  const { sessionId } = req.query;
  if (!orderId || !sessionId) {
    return res.status(400).json({ error: "Missing orderId or sessionId" });
  }

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.sessionId !== sessionId) {
      return res
        .status(403)
        .json({ error: "Session ID does not match this order" });
    }

    return res.json({ data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.editOrder = async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;

  try {
    // Find the order by orderId and update it with the new data
    const updatedOrder = await Order.findOneAndUpdate({ orderId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order updated successfully", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
