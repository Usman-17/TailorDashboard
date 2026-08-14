export const sendEmail = async (data) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.MAIL_FROM || "Tailor Dashboard <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("RESEND_API_KEY not set");
    throw new Error("Email service not configured");
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || "Email send failed");
    }

    console.log(`Email sent to ${data.to}: ${result.id}`);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
