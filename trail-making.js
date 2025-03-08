const LAMBDA_API_URL = 'https://izhteugt17.execute-api.eu-north-1.amazonaws.com/prod';

const emailData = {
  from_name: 'Alfonso',
  subject: 'Correo de prueba',
  message: 'Este es un correo de prueba desde el cliente.',
};

async function sendEmail() {
  try {
    const response = await fetch(LAMBDA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error('Error al enviar el correo.');
    }

    const result = await response.json();
    console.log('Correo enviado con éxito:', result);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

sendEmail();

