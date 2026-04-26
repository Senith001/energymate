import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export const sendEmail = async ({ to, subject, html }) => {
  const from = requireEnv("EMAIL_FROM");

  const msg = {
    to,
    from,
    subject,
    html,
  };

  try {
    const response = await sgMail.send(msg);

    console.log("✅ Email sent successfully:", {
      to,
      subject,
      statusCode: response[0]?.statusCode,
    });

    return response;
  } catch (error) {
    console.error(
      "❌ SendGrid Error:",
      error.response?.body || error.message
    );
    throw error;
  }
};