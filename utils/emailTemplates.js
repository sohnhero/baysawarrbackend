
const headerStyle = `
  background-color: #059669;
  padding: 20px;
  text-align: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const bodyStyle = `
  padding: 30px;
  background-color: #ffffff;
  color: #333333;
  line-height: 1.6;
`;

const footerStyle = `
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #666666;
  background-color: #f9fafb;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
`;

const buttonStyle = `
  display: inline-block;
  background-color: #059669;
  color: #ffffff;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  margin-top: 20px;
`;

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">BAY SA WAAR</h1>
    </div>
    <div style="${bodyStyle}">
      <h2 style="color: #059669; margin-top: 0;">${title}</h2>
      ${content}
    </div>
    <div style="${footerStyle}">
      <p>&copy; ${new Date().getFullYear()} BAY SA WAAR. Tous droits réservés.</p>
      <p>Dakar, Sénégal | contact@baysawaar.sn</p>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeEmail = (firstName, email, password) => {
  const content = `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Félicitations ! Votre demande d'inscription a été <strong>APPROUVÉE</strong>.</p>
    <p>Un compte membre a été créé spécialement pour vous. Voici vos identifiants de connexion :</p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
      <p style="margin: 5px 0;"><strong>Mot de passe :</strong> <code style="background-color: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${password}</code></p>
    </div>
    <div style="text-align: center;">
      <a href="https://baysawaar.com/login" style="${buttonStyle}">Accéder à mon compte</a>
    </div>
    <p style="margin-top: 30px;">Bienvenue dans notre communauté d'impact !</p>
  `;
  return baseTemplate('Bienvenue chez Bay Sa Waar !', content);
};

export const getApprovalEmail = (firstName) => {
  const content = `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Nous avons le plaisir de vous informer que votre nouvelle demande d'inscription a été <strong>APPROUVÉE</strong>.</p>
    <p>Comme vous possédez déjà un compte chez nous, vous pouvez simplement continuer à utiliser vos identifiants habituels pour accéder aux nouvelles fonctionnalités.</p>
    <div style="text-align: center;">
      <a href="https://baysawaar.com/login" style="${buttonStyle}">Se connecter</a>
    </div>
  `;
  return baseTemplate('Demande Approuvée', content);
};

export const getRejectionEmail = (firstName) => {
  const content = `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Nous vous remercions pour l'intérêt que vous portez à <strong>BAY SA WAAR</strong>.</p>
    <p>Après une étude attentive de votre dossier, nous avons le regret de vous informer que votre demande d'inscription n'a pas été retenue pour le moment.</p>
    <p>N'hésitez pas à nous recontacter si vous avez des questions ou pour de futures opportunités.</p>
  `;
  return baseTemplate('Mise à jour de votre demande', content);
};

export const getRegistrationReceivedEmail = (firstName, type) => {
  const content = `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Nous avons bien reçu votre demande d'inscription pour : <strong>${type}</strong>.</p>
    <p>Votre dossier est actuellement <strong>en cours d'examen</strong> par notre équipe. Vous recevrez une notification par email dès qu'une décision sera prise (généralement sous 24 à 48 heures).</p>
    <p>Merci de votre patience et de votre confiance.</p>
  `;
  return baseTemplate('Demande reçue', content);
};

export const getEventRegistrationEmail = (firstName, eventTitle, eventDate, eventLocation) => {
  const content = `
    <p>Bonjour <strong>${firstName}</strong>,</p>
    <p>Vous êtes bien inscrit à l'événement :</p>
    <h3 style="color: #111827;">${eventTitle}</h3>
    <ul style="list-style: none; padding: 0; margin: 20px 0;">
      <li style="margin-bottom: 10px;">📅 <strong>Date :</strong> ${eventDate}</li>
      <li style="margin-bottom: 10px;">📍 <strong>Lieu :</strong> ${eventLocation}</li>
    </ul>
    <p>Nous avons hâte de vous y retrouver !</p>
  `;
  return baseTemplate('Confirmation d\'inscription', content);
};

export const getAdminNotificationEmail = (title, details) => {
  // Convert newlines to breaks for admin view
  const formattedDetails = details.replace(/\n/g, '<br>');
  const content = `
    <p>Une nouvelle action nécessite votre attention ou vous informe :</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace;">
      ${formattedDetails}
    </div>
    <div style="text-align: center;">
      <a href="https://baysawaar.com/admin/dashboard" style="${buttonStyle}">Ouvrir le Dashboard</a>
    </div>
  `;
  return baseTemplate(`Admin: ${title}`, content);
};

export const getResetPasswordEmail = (tempPassword) => {
  const content = `
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Voici votre mot de passe temporaire :</p>
    <div style="text-align: center; margin: 20px 0;">
       <code style="background-color: #f3f4f6; padding: 10px 20px; font-size: 18px; letter-spacing: 2px; border-radius: 6px; border: 1px dashed #059669;">${tempPassword}</code>
    </div>
    <p>Veuillez vous connecter et changer ce mot de passe immédiatement.</p>
    <div style="text-align: center;">
      <a href="https://baysawaar.com/login" style="${buttonStyle}">Se connecter</a>
    </div>
  `;
  return baseTemplate('Réinitialisation du mot de passe', content);
};
