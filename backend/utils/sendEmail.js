import nodemailer from "nodemailer";

export const sendEmail = async (data) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      socketTimeout: 20000,
      greetingTimeout: 5000,
      auth: {
        user: process.env.MAIL_ID,
        pass: (process.env.MAIL_PASSWORD || "").replace(/\s/g, ""),
      },
    });

    const senderEmail = process.env.MAIL_ID;

    const info = await transporter.sendMail({
      from: `"Tailor Dashboard" <${senderEmail}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

    console.log(
      `Email sent to ${data.to}: ${info.messageId || "OK"}`
    );
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};