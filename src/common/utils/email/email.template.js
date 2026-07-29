export const lowStockEmailTemplate = ({
  productName,
  currentStock,
  productId,
}) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Low Stock Alert</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F4EF; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="550" cellpadding="0" cellspacing="0" style="background:#FFFFFF; margin:40px 0; border-radius:10px; overflow:hidden; border: 1px solid #D9D6CF; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Header (Primary: #234E52) -->
          <tr>
            <td style="background:#234E52; padding:20px; text-align:center; color:#FFFFFF; font-size:22px; font-weight:bold;">
              ⚠️ Low Stock Alert!
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; text-align:left; color:#20262E;">
              <h2 style="margin:0 0 15px 0; color:#234E52; font-size:18px;">Inventory Running Low</h2>
              <p style="font-size:15px; line-height:1.5; color:#667085;">
                Attention Admin, the following product in your inventory has fallen below the safety threshold:
              </p>

              <!-- Details Box (Background: #F6F4EF, Border Accent: #C17C3A) -->
              <table width="100%" style="background:#F6F4EF; border-left:4px solid #C17C3A; border-top:1px solid #D9D6CF; border-right:1px solid #D9D6CF; border-bottom:1px solid #D9D6CF; padding:15px; margin:20px 0; border-radius:4px;">
                <tr>
                  <td>
                    <p style="margin:5px 0; font-size:15px; color:#20262E;"><strong>Product Name:</strong> ${productName}</p>
                    <p style="margin:5px 0; font-size:15px; color:#20262E;"><strong>Remaining Stock:</strong> <span style="color:#C17C3A; font-weight:bold; font-size:18px;">${currentStock}</span> units</p>
                    <p style="margin:5px 0; font-size:13px; color:#667085;"><strong>Product ID:</strong> ${productId}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px; color:#667085;">
                Please reorder or update stock as soon as possible to avoid disruption in sales.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F6F4EF; border-top:1px solid #D9D6CF; padding:15px; text-align:center; font-size:12px; color:#667085;">
              © ${new Date().getFullYear()} Noventra SaaS Dashboard.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const dailySalesReportTemplate = ({
  date,
  totalSales,
  totalRevenue,
  totalProfit,
  topProduct,
}) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Daily Sales Summary</title>
</head>
<body style="margin:0; padding:0; background-color:#F6F4EF; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="550" cellpadding="0" cellspacing="0" style="background:#FFFFFF; margin:40px 0; border-radius:10px; overflow:hidden; border: 1px solid #D9D6CF; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Header (Primary: #234E52) -->
          <tr>
            <td style="background:#234E52; padding:20px; text-align:center; color:#FFFFFF; font-size:22px; font-weight:bold;">
              📊 Daily Performance Report
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; text-align:left;">
              <h3 style="margin:0 0 10px 0; color:#234E52;">Summary for ${date}</h3>
              <p style="font-size:14px; color:#667085; margin-bottom:20px;">
                Here is your store's automated daily summary:
              </p>

              <!-- Metrics Table -->
              <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse; border:1px solid #D9D6CF;">
                <tr style="background:#F6F4EF; border-bottom:1px solid #D9D6CF;">
                  <td style="font-size:14px; color:#667085;">Total Invoices Processed</td>
                  <td style="font-size:16px; font-weight:bold; color:#20262E;" align="right">${totalSales}</td>
                </tr>
                <tr style="border-bottom:1px solid #D9D6CF;">
                  <td style="font-size:14px; color:#667085;">Total Revenue</td>
                  <td style="font-size:16px; font-weight:bold; color:#234E52;" align="right">$${totalRevenue}</td>
                </tr>
                <tr style="background:#F6F4EF; border-bottom:1px solid #D9D6CF;">
                  <td style="font-size:14px; color:#667085;">Net Profit</td>
                  <td style="font-size:16px; font-weight:bold; color:#234E52;" align="right">$${totalProfit}</td>
                </tr>
                ${
                  topProduct
                    ? `
                <tr>
                  <td style="font-size:14px; color:#667085;">Top Selling Product</td>
                  <td style="font-size:14px; font-weight:bold; color:#C17C3A;" align="right">${topProduct}</td>
                </tr>`
                    : ""
                }
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F6F4EF; border-top:1px solid #D9D6CF; padding:15px; text-align:center; font-size:12px; color:#667085;">
              © ${new Date().getFullYear()} Noventra SaaS Dashboard Automated Cron System.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
