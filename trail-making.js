async function getEmailJSConfig() {
  try {
    const response = await fetch('http://localhost:3000/emailjs-config');
    if (!response.ok) {
      throw new Error('No se pudieron obtener las configuraciones de EmailJS');
    }
    const config = await response.json();
    console.log('Configuración de EmailJS recibida:', config);

    // Inicializa EmailJS con la clave pública
    emailjs.init(config.public_key);

    // Devuelve los valores de configuración
    return config;
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
  }
}

// Usar la configuración para enviar el correo
async function sendExperimentResults() {
  const config = await getEmailJSConfig();

  // Si no se pudo recuperar la configuración, salimos de la función
  if (!config) return;

  // Crear el contenido del correo
  const emailData = {
    from_name: 'Tu Nombre',
    to_name: 'investigacionmovil.uned@gmail.com',
    subject: 'Resultados del experimento',
    message: 'Este es el mensaje del experimento',
  };

  // Enviar el correo usando EmailJS
  emailjs.send(config.service_id, config.template_id, emailData)
    .then(response => {
      console.log('Correo enviado con éxito:', response);
    })
    .catch(error => {
      console.error('Error al enviar el correo:', error);
    });
}
