import { sendEmail } from "./send.email.js";
import { lowStockEmailTemplate, dailySalesReportTemplate } from "./email.template.js";


export const sendLowStockEmail = async ({ adminEmail, productName, currentStock, productId }) => {
  return await sendEmail({
    to: adminEmail,
    subject: `🚨 Low Stock Warning: ${productName} (${currentStock} left)`,
    html: lowStockEmailTemplate({ productName, currentStock, productId }),
  });
};


export const sendDailyReportEmail = async ({ adminEmail, reportData }) => {
  return await sendEmail({
    to: adminEmail,
    subject: `📊 Daily Sales Report - ${reportData.date}`,
    html: dailySalesReportTemplate(reportData),
  });
};