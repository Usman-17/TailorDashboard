import nodemailer from "nodemailer";

let transporterVerified = false;

export const sendEmail = async (data) => {
  try {
    const mailId = process.env.MAIL_ID;
    const mailPassword = (process.env.MAIL_PASSWORD || "").replace(/\s/g, "");

    if (!mailId || !mailPassword) {
      throw new Error(
        "MAIL_ID and MAIL_PASSWORD are not configured in environment variables"
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
      connectionTimeout: 10000,
      socketTimeout: 20000,
      greetingTimeout: 5000,
      auth: {
        user: mailId,
        pass: mailPassword,
      },
    });

    if (!transporterVerified) {
      try {
        await transporter.verify();
        console.log("SMTP transporter verified successfully");
        transporterVerified = true;
      } catch (verifyError) {
        console.error("SMTP transporter verification failed:", verifyError.message);
        throw new Error(
          `SMTP connection failed: ${verifyError.message}. Check MAIL_ID, MAIL_PASSWORD, and SMTP settings.`
        );
      }
    }

    const info = await transporter.sendMail({
      from: `"Tailor Dashboard" <${mailId}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });

    console.log(`Email sent to ${data.to} | MessageId: ${info.messageId || "N/A"} | Response: ${info.response || "N/A"}`);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
