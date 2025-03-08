// URL de tu API Gateway para la función Lambda
const LAMBDA_API_URL = 'https://izhteugt17.execute-api.eu-north-1.amazonaws.com/prod';

// Función para enviar un correo de prueba
async function sendTestEmail() {
  const testEmailData = {
    from_name: 'Prueba Alfonso', // El nombre del remitente
    subject: 'Correo de prueba desde Lambda', // Asunto del correo
    message: 'Este es un correo de prueba para verificar la integración de AWS Lambda y Gmail.', // Contenido del mensaje
  };

  try {
    const response = await fetch(LAMBDA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData),
    });

    if (!response.ok) {
      throw new Error(`Error al enviar el correo: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Correo enviado con éxito:', result);
    alert('¡Correo de prueba enviado con éxito!');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    alert('Hubo un error al enviar el correo de prueba. Por favor, verifica la configuración.');
  }
}

// Ejecutar el envío del correo de prueba al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  sendTestEmail();
});
