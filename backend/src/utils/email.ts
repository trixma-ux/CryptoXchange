import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0e1a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; }
    .header h1 { margin: 0; color: #000; font-size: 24px; font-weight: 800; }
    .body { padding: 40px 30px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; }
    .footer { background: #0a0e1a; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    p { line-height: 1.6; color: #94a3b8; }
    h2 { color: #f1f5f9; margin-bottom: 8px; }
    .code { background: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: 800; letter-spacing: 8px; text-align: center; color: #f59e0b; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚡ CryptoXchange</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© 2024 CryptoXchange. Tous droits réservés.</p>
      <p>Si vous n'avez pas effectué cette action, ignorez cet email.</p>
    </div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  const verificationUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"CryptoXchange" <${config.email.from}>`,
      to: email,
      subject: 'Vérifiez votre email — CryptoXchange',
      html: emailTemplate(`
        <h2>Bienvenue, ${name} ! 👋</h2>
        <p>Merci de créer votre compte CryptoXchange. Veuillez vérifier votre adresse email pour activer votre compte.</p>
        <div style="text-align:center">
          <a href="${verificationUrl}" class="btn">Vérifier mon email</a>
        </div>
        <p>Ce lien expire dans <strong>24 heures</strong>.</p>
      `),
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"CryptoXchange" <${config.email.from}>`,
      to: email,
      subject: 'Réinitialisation de mot de passe — CryptoXchange',
      html: emailTemplate(`
        <h2>Réinitialisation du mot de passe</h2>
        <p>Bonjour ${name}, vous avez demandé une réinitialisation de votre mot de passe.</p>
        <div style="text-align:center">
          <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
        </div>
        <p>Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      `),
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email:`, error);
  }
};

export const sendNotificationEmail = async (email: string, subject: string, content: string) => {
  try {
    await transporter.sendMail({
      from: `"CryptoXchange" <${config.email.from}>`,
      to: email,
      subject,
      html: emailTemplate(content),
    });
  } catch (error) {
    logger.error(`Failed to send notification email:`, error);
  }
};
