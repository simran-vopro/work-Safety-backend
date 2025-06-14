const Order = require("../models/Order");
const Cart = require("../models/Cart");
const nodemailer = require("nodemailer");
const path = require("path");
const { frontendUrl } = require("../utils/config");
const generateOrderId = require("../utils/generateOrderId");
const { default: axios } = require("axios");
const User = require("../models/User");

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

// exports.requestQuote = async (req, res) => {
//   const {
//     firstName,
//     lastName,
//     address,
//     address2,
//     city,
//     postcode,
//     company,
//     subject,
//     text,
//     email,
//     userId,
//     products,
//   } = req.body;

//   if (
//     !email ||
//     !subject ||
//     !text ||
//     !products ||
//     !userId ||
//     !firstName ||
//     !lastName ||
//     !address
//   ) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const fullName = `${firstName} ${lastName}`;

//   try {
//     const cart = await Cart.findOne({ userId }).populate("items.productId");

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     if (!areSameProducts(cart.items, products)) {
//       return res
//         .status(400)
//         .json({ message: "Cart items do not match the requested products" });
//     }

//     const simplifiedProducts = products.map((p) => ({
//       productId: p.productId._id,
//       code: p.productId.Code,
//       description: p.productId.Description,
//       image: p.productId["Image Ref"],
//       quantity: p.quantity,
//       unitPrice: p.productId.UnitPrice || 0,
//     }));


//     let attachments = [];

//     const cidMap = await Promise.all(
//       simplifiedProducts.map(async (p, i) => {
//         try {
//           const response = await axios.get(p.image, { responseType: "arraybuffer" });
//           const cid = `product-${i}@quote`;
//           const ext = path.extname(p.image).slice(1) || "jpg";

//           attachments.push({
//             filename: `image${i}.${ext}`,
//             content: Buffer.from(response.data, "binary"),
//             cid: cid,
//           });

//           return cid;
//         } catch (error) {
//           console.warn(`Failed to download image ${p.image}: ${error.message}`);
//           return null; // fallback
//         }
//       })
//     );


//     const productTableRows = simplifiedProducts.map((p, i) => {
//       const cid = cidMap[i];
//       const imageTag = cid
//         ? `<img src="cid:${cid}" alt="${p.code}" style="width: 100px; height: auto; margin: 0 auto 4px;" />`
//         : "Image not available";

//       return `
//   <tr>
//     <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">
//       ${imageTag}
//     </td>
//     <td style="padding: 4px 8px; border: 1px solid #ddd;">
//       <a href="${frontendUrl}/projectDetails/${p.productId}" target="_blank" style="color: #007bff; text-decoration: none;">
//         ${p.code}
//       </a>
//     </td>
//     <td style="padding: 4px 8px; border: 1px solid #ddd;">
//       <a href="https://work-safety-backend.onrender.com/projectDetails/${p.productId}" target="_blank" style="color: #007bff; text-decoration: none;">
//         ${p.description}
//       </a>
//     </td>
//     <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
//     <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${p.unitPrice.toFixed(2)}</td>
//     <td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">£${(p.unitPrice * p.quantity).toFixed(2)}</td>
//   </tr>
//   `;
//     }).join("");


//     const subtotal = simplifiedProducts.reduce(
//       (sum, p) => sum + p.unitPrice * p.quantity,
//       0
//     );
//     const vat = subtotal * 0.2;
//     const total = subtotal + vat;
//     // const orderId = "ORD-" + nanoid(8);
//     const orderId = await generateOrderId();
//     console.log("orderId ==> ", orderId);

//     const newOrder = await Order.create({
//       orderId,
//       email,
//       firstName,
//       lastName,
//       fullName,
//       address,
//       address2,
//       city,
//       postcode,
//       company,
//       userId,
//       message: text,
//       products: simplifiedProducts,
//     });

//     let transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: parseInt(process.env.SMTP_PORT),
//       secure: process.env.SMTP_PORT == "465",
//       auth: {
//         user: process.env.SMTP_USERNAME,
//         pass: process.env.SMTP_PASSWORD,
//       },
//     });

//     const mailHtml = `
// <p>Hi ${firstName},</p>

// <p>Thank you for reaching out to us – we’re delighted to support your PPE needs!<br />
// Please find below your personalised quote, carefully prepared based on the items you requested:</p>

// <h3>🛒 Quotation Summary</h3>
// <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
//   <thead>
//     <tr>
//       <th style="border: 1px solid #ddd; padding: 8px;">Image</th>
//       <th style="border: 1px solid #ddd; padding: 8px;">Product</th>
//       <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
//       <th style="border: 1px solid #ddd; padding: 8px;">Qty</th>
//       <th style="border: 1px solid #ddd; padding: 8px;">Unit Price</th>
//       <th style="border: 1px solid #ddd; padding: 8px;">Total Price</th>
//     </tr>
//   </thead>
//   <tbody>
//     ${productTableRows}
//   </tbody>
// </table>

// <p><strong>Subtotal:</strong> £${subtotal.toFixed(2)}<br />
// <strong>VAT (20%):</strong> £${vat.toFixed(2)}<br />
// <strong>Total Payable:</strong> £${total.toFixed(2)}</p>

// <h3>🛡️ Our Quality Commitment</h3>
// <ul>
//   <li>✅ All products meet the highest UK safety standards</li>
//   <li>✅ Supplied with Declaration of Conformity (UK)</li>
//   <li>✅ Products tested and compliant with relevant BS and EN safety norms</li>
//   <li>✅ Next working day delivery available on all in-stock items (for orders placed before 1 PM)</li>
// </ul>

// <p>✅ Click below to confirm your order:<br />
// 👉 <a href="https://work-safety-backend.onrender.com/confirm-order/${orderId}" target="_blank" style="color: #007bff;">
//   Place / Confirm Your Order Now
// </a>
// </p>

// <p>If you need to make changes, request additional products, or have any questions, feel free to reply directly or reach out to us.</p>

// <p>We’re committed to helping your business stay safe and compliant—efficiently and affordably.</p>

// <p>Best regards,<br />
// [Your Full Name]<br />
// [Your Role]<br />
// Work Wear Pvt. Ltd.<br />
// 📞 xxxxxxxxx<br />
// ✉️ hello@workwearcompany.co.uk<br />
// 🌐 workwearcompany.co.uk</p>
// `;

//     let mailOptions = {
//       from: process.env.SMTP_FROM_EMAIL,
//       to: email,
//       subject: `Your personalised quote - ${subject}`,
//       html: mailHtml,
//       attachments: attachments,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     await Cart.deleteOne({ userId });

//     return res.status(200).json({
//       message: "Quote requested successfully",
//       order: newOrder,
//       mailInfo: info.response,
//     });
//   } catch (error) {
//     console.error("Quote request error:", error);
//     return res.status(500).json({ error: "Failed to send request" });
//   }
// };

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
  } = req.body;

  if (!email || !products || !userId || !firstName || !lastName || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (!areSameProducts(cart.items, products)) {
      return res.status(400).json({ message: "Cart and quote items mismatch" });
    }

    const simplifiedProducts = products.map((p) => ({
      productId: p.productId._id,
      code: p.productId.Code,
      description: p.productId.Description,
      image: p.productId["Image Ref"],
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
      status: "pending",
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
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${imageTag}</td>
  <td style="border: 1px solid #ddd; padding: 8px;">${p.code}</td>
  <td style="border: 1px solid #ddd; padding: 8px;">${p.description}</td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">£${p.unitPrice?.toFixed(2)}</td>
  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">£${p.totalPrice?.toFixed(2)}</td>
</tr>`;
    }).join("");

    const mailHtml = `
<p>Hi ${order.firstName},</p>
<p>Here's your updated quotation including final prices:</p>
<table style="width:100%; border-collapse: collapse;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px;">Image</th>
      <th style="border: 1px solid #ddd; padding: 8px;">Code</th>
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
<strong>VAT:</strong> £${tax.toFixed(2)}<br />
<strong>Total:</strong> £${total.toFixed(2)}</p>
<p><a href="https://work-safety-backend.onrender.com/confirm-order/${order.orderId}" target="_blank">👉 Confirm Your Order</a></p>
<p>Regards,<br />Work Wear Pvt. Ltd.</p>`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT == "465",
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

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

// 3️⃣ Get Orders Based on User Type
exports.getOrders = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findOne({ userId: userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    const orders = user.type === "admin"
      ? await Order.find({}).sort({ createdAt: -1 })
      : await Order.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrder = async (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.query;
  if (!orderId || !userId) {
    return res.status(400).json({ error: "Missing orderId or userId" });
  }

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== userId) {
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
