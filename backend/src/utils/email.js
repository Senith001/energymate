import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 Force Node.js to prefer IPv4 (fixes Railway + Gmail issue)
dns.setDefaultResultOrder("ipv4first");

const requireEnv = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
};

export const sendEmail = async ({ to, subject, html }) => {
  // Validate required env vars
  const host = requireEnv("EMAIL_HOST");
  const port = Number(requireEnv("EMAIL_PORT"));
  const user = requireEnv("EMAIL_USER");
  const pass = requireEnv("EMAIL_PASS");
  const from = requireEnv("EMAIL_FROM");

  const secure =
    process.env.EMAIL_SECURE === "true" || port === 465;

  const isGmail = host.toLowerCase().includes("gmail");

  // ✅ Transporter with IPv4 enforcement
  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: "gmail",
          auth: { user, pass },
          family: 4, // 🔥 force IPv4
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          family: 4, // 🔥 force IPv4
          tls: {
            rejectUnauthorized: false,
          },
        }
  );

  // 🔍 Verify SMTP connection
  await transporter.verify();

  // 📧 Send email
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
};