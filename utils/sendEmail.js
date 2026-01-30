import { Resend } from 'resend';
import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendWithGmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER ou EMAIL_PASS manquant');
    }

    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Vérification de la connexion
    await transporter.verify();

    const result = await transporter.sendMail({
      from: `Bay Sa Waar <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email envoyé avec succès via Gmail:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email (Gmail):', error);
    return null;
  }
};

const sendWithResend = async (to, subject, html) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY manquant');
      return null;
    }

    const { data, error } = await resend.emails.send({
      from: 'Bay Sa Waar <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return null;
    }

    console.log('✅ Email envoyé via Resend:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Exception sendEmail (Resend):', error);
    return null;
  }
};

const sendEmail = async (to, subject, html) => {
  const provider = process.env.EMAIL_PROVIDER || 'gmail';

  if (provider === 'resend') {
    return await sendWithResend(to, subject, html);
  } else {
    return await sendWithGmail(to, subject, html);
  }
};

export default sendEmail;
