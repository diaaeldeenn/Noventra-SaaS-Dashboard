import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Noventra SaaS Dashboard" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent successfully: %s", info.messageId);
  return info.accepted.length > 0;
};
