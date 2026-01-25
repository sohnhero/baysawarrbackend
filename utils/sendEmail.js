import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY manquant');
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'Bay Sa Waar <onboarding@resend.dev>',
      to,
      subject,
      html // using html content
    });

    if (error) {
      console.error('❌ Erreur Resend:', error);
      return null;
    }

    console.log('✅ Email envoyé:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Exception sendEmail:', error);
    // Don't throw if we want background processing resilience, but keeping consistent with "async" behavior 
    // where caller decides to await or catch.
    return null;
  }
};

export default sendEmail;
