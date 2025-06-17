const Order = require("../models/Order");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");
const path = require("path");
const generateOrderId = require("../utils/generateOrderId");
const { default: axios } = require("axios");
const User = require("../models/User");
const { frontendUrl } = require("../utils/config");
const bcrypt = require("bcryptjs");

// Compare cart items with products sent in request
const areSameProducts = (cartItems, requestProducts) => {
  if (cartItems.length !== requestProducts.length) return false;

  const cartMap = new Map();
  cartItems.forEach((item) => {
    cartMap.set(item.product._id.toString(), item.quantity);
  });

  for (const p of requestProducts) {
    const id = typeof p.productId === "string" ? p.productId : p.product._id;
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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT == "465",
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

exports.requestQuote = async (req, res) => {
  const {
    firstName,
    lastName,
    address,
    address2,
    city,
    postcode,
    company,
    email,
    userId,
    products,
    phone
  } = req.body;


  if (!email || !products || !userId || !firstName || !lastName || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (!areSameProducts(cart.items, products)) {
      return res.status(400).json({ message: "Cart and quote items mismatch" });
    }

    const simplifiedProducts = products.map((p) => ({
      productId: p.product._id,
      code: p.product.Code,
      description: p.product.Description,
      image: p.product["Image Ref"],
      quantity: p.quantity,
    }));

    const orderId = await generateOrderId();

    const newOrder = await Order.create({
      orderId,
      email,
      firstName,
      lastName,
      address,
      address2,
      city,
      postcode,
      company,
      userId,
      products: simplifiedProducts,
      status: "Pending",
      phone
    });

    await Cart.deleteOne({ userId });

    return res.status(200).json({
      message: "Quote request created successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("Quote creation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// 2️⃣ ADMIN API - Finalize Quote With Prices & Send Mail
exports.finalizeQuote = async (req, res) => {
  const { orderId, deliveryCharges = 0, products, subtotal, tax, total } = req.body;

  try {
    const order = await Order.findOne({ orderId }).populate("products.productId");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Replace product data directly from frontend (already contains prices)
    order.products = products;
    order.deliveryCharges = deliveryCharges;
    order.subtotal = subtotal;
    order.tax = tax;
    order.total = total;
    order.status = "Quotation Sent"

    await order.save();

    // Email attachments (images)
    let attachments = [];
    const cidMap = await Promise.all(
      products.map(async (p, i) => {
        try {
          const response = await axios.get(p.image, { responseType: "arraybuffer" });
          const cid = `product-${i}@quote`;
          const ext = path.extname(p.image).slice(1) || "jpg";

          attachments.push({
            filename: `image${i}.${ext}`,
            content: Buffer.from(response.data, "binary"),
            cid,
          });

          return cid;
        } catch (error) {
          console.warn(`Failed to load image for ${p.code}:`, error.message);
          return null;
        }
      })
    );

    // HTML product rows
    const productTableRows = products.map((p, i) => {
      const cid = cidMap[i];
      const imageTag = cid
        ? `<img src="cid:${cid}" style="width: 100px; height: auto;" />`
        : "Image not available";

      return `
<tr>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${imageTag}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    <a href="${frontendUrl}/projectDetails/${p.productId}" target="_blank" style="color: #007bff;">
      ${p.code}
    </a>
  </td>
  <td style="border: 1px solid #ddd; padding: 8px;">
    ${p.description}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
    ${p.quantity}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.unitPrice?.toFixed(2) ?? '0.00'}
  </td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">
    £${p.totalPrice?.toFixed(2) ?? '0.00'}
  </td>
</tr>
`;
    }).join("");

    const mailHtml = `
<p>Hi ${order?.firstName},</p>

<p>Thank you for reaching out to us – we’re delighted to support your PPE needs!<br />
Please find below your personalised quote, carefully prepared based on the items you requested:</p>

<h3>🛒 Quotation Summary</h3>
<table style="border-collapse: collapse; width: 100%; max-width: 600px;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px;">Image</th>
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
<strong>VAT (20%):</strong> £${tax.toFixed(2)}<br />
<strong>Delivery Charges:</strong> £${order.deliveryCharges.toFixed(2)}<br />
<strong>Total Payable:</strong> £${total.toFixed(2)}</p>

<h3>🛡️ Our Quality Commitment</h3>
<ul>
  <li>✅ All products meet the highest UK safety standards</li>
  <li>✅ Supplied with Declaration of Conformity (UK)</li>
  <li>✅ Products tested and compliant with relevant BS and EN safety norms</li>
  <li>✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)</li>
</ul>

<p>✅ Click below to confirm your order:<br />
👉 <a href="${frontendUrl}/confirm-order/${orderId}" target="_blank" style="color: #007bff;">
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
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: order.email,
      subject: `Final Quote - Order ${order.orderId}`,
      html: mailHtml,
      attachments,
    });

    return res.status(200).json({ message: "Quote finalized and email sent", order });
  } catch (error) {
    console.error("finalizeQuote error:", error);
    return res.status(500).json({ error: "Failed to finalize quote" });
  }
};

exports.getOrders = async (req, res) => {
  const userId = req.user.userId;
  let statusFilters = req.query.status; // can be string or array

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const query = {};

    // Admin gets all orders, users only their own
    if (user.type !== "admin") {
      query.userId = userId;
    }

    // Normalize status filter
    if (statusFilters) {
      if (!Array.isArray(statusFilters)) {
        statusFilters = [statusFilters];
      }
      query.status = { $in: statusFilters };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ data: orders });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrder = async (req, res) => {
  const { orderId } = req.params;
  // const userId = req.user.userId;

  // if (!orderId || !userId) {
  //   return res.status(400).json({ error: "Missing orderId or userId" });
  // }

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // if (order.userId !== userId) {
    //   return res
    //     .status(403)
    //     .json({ error: "Session ID does not match this order" });
    // }

    return res.json({ data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.confirm_Order = async (req, res) => {
  const { orderId } = req.params;
  const updateData = req.body;
  const { userId } = updateData;

  try {
    // Step 1: Find the order
    const existingOrder = await Order.findOne({ orderId });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Step 2: Validate user ownership
    if (existingOrder.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized: This order does not belong to you." });
    }

    // Step 3: Promote guest to registered user if needed
    const existingUser = await User.findOne({ userId });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }


    const password = userId; //
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser.type === "guest") {
      await User.findOneAndUpdate(
        { userId },
        {
          type: "user",
          password: hashedPassword,
          email : existingOrder.email,
          phone: existingOrder.phone,
          firstName : existingOrder.firstName,
          lastName: existingOrder.lastName,
          address : existingOrder.address,
          company : existingOrder.company,
          city: existingOrder.city,
        },
        { new: true }
      );
    }

    // Step 4: Confirm the order
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true, runValidators: true }
    );



    const mailHtml = `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
    <h2 style="color: #007bff;">Thank you for your order!</h2>

    <p>Hi ${updatedOrder.name || "Customer"},</p>

    <p>We’re pleased to inform you that your order <strong>#${updatedOrder.orderId}</strong> has been successfully placed.</p>

    <p>Your account has been upgraded from guest to a registered user. You can now log in using the following credentials:</p>
      <ul>
        <li><strong>User ID:</strong> ${userId}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>We recommend you log in and update your password for security reasons.</p>
      <p><a href="${frontendUrl}/login" style="color: #007bff;">Click here to log in</a></p>
      
        
    }

    <p>If you have any questions, feel free to reach out to our support team.</p>

    <p style="margin-top: 30px;">Best regards,<br/>The ${process.env.COMPANY_NAME || "Team"}</p>
  </div>
`;



    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: updatedOrder.email,
      subject: `Final Quote - Order ${updatedOrder.orderId}`,
      html: mailHtml,
    });

    res.json({
      message: "Order confirmed successfully",
      order: updatedOrder,
    });

  } catch (err) {
    console.error("Error confirming order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};






