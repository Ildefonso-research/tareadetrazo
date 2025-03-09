// Importar las dependencias
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Habilita CORS
app.use(bodyParser.json()); // Parsear datos JSON

// no favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Ruta para el raíz
app.get('/', (req, res) => {
  res.send('¡El servidor está funcionando correctamente!');
});

// Endpoint para enviar correos
app.post('/send-email', async (req, res) => {
  const { from_name, to_name, subject, message } = req.body;

  // Validar datos
  if (!from_name || !to_name || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
  }

  try {
    // Enviar correo con EmailJS
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,  // Usar variables configuradas en Render
      process.env.EMAILJS_TEMPLATE_ID,
      { from_name, to_name, subject, message },
      process.env.EMAILJS_USER_ID
    );
    console.log('Correo enviado:', response);
    res.status(200).json({ success: true, message: 'Correo enviado exitosamente.' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ success: false, message: 'Error al enviar correo.' });
  }
});

// Endpoint para proporcionar las configuraciones de EmailJS
app.get('/get-email-config', (req, res) => {
  try {
    const emailConfig = {
      userID: process.env.EMAILJS_USER_ID,
      serviceID: process.env.EMAILJS_SERVICE_ID,
      templateID: process.env.EMAILJS_TEMPLATE_ID
    };
    res.json(emailConfig);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});



