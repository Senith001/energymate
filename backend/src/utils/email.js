import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 Force IPv4 (fixes Railway networking issues)
dns.setDefaultResultOrder("ipv4first");

const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export const sendEmail = async ({ to, subject, html }) => {
  // Env variables
  const host = requireEnv("EMAIL_HOST"); // we will ignore "service gmail"
  const user = requireEnv("EMAIL_USER");
  const pass = requireEnv("EMAIL_PASS");
  const from = requireEnv("EMAIL_FROM");

  // Always use stable Gmail SMTP config for cloud deployments
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS upgrade via STARTTLS
    auth: {
      user,
      pass,
    },

    family: 4, // force IPv4

    // 🔥 Important for Railway (prevents ETIMEDOUT)
    connectionTimeout: 20000, // 20s
    greetingTimeout: 20000,
    socketTimeout: 30000,

    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Verify SMTP connection
    await transporter.verify();

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", {
      to,
      subject,
      messageId: info.messageId,
    });

    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};