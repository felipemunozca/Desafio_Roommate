/**
 * instalar el paquete nodemailer
 * > npm i nodemailer
 */

/* asigno las variables de los paquetes a utilizar. */
const nodemailer = require("nodemailer");

/* se crea una variable transporter para pasarle el metodo createTransport. (Esta es la forma estandar de utilizar nodemailer, ideal no cambiarlo) */
/* como primer parametro, el tipo de servicio o proveedor de correo que utilizare. */
/* como segundo parametro, las credenciales de mi correo personal. */
/* como tercer parametro, el TLS que es un protocolo o capa de seguridad de los correos. */
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "correopruebafmunoz@gmail.com",
        pass: "Programador2022*",
    },
    tls: {rejectUnauthorized: false}
});

/* se crea una funcion para enviar el correo, recibe parametros desde el archivo index.js */
/* se crea la plantilla con la estructura que tendra el correo. */
const enviarCorreo = async (nombre, descripcion, monto, correos) => {
    let mailOptions = {
        from: "correopruebafmunoz@gmail.com",
        to: ["correopruebafmunoz@gmail.com"].concat(correos),
        subject: `Nuevo gasto registrado de ${nombre}`,
        html: `<h3>Hola, nuestr@ compañer@ ${nombre}. Ha registrado un nuevo gasto en: ${descripcion}, por un monto de: $ ${monto}.</h3>`
    };

    console.log(mailOptions);
    
    try {
        const result = await transporter.sendMail(mailOptions);
        console.log("Correo enviado!!")
        return result;
    } catch (e) {
        console.log("NO se pudo enviar el correo", e)
        throw e;
    }
};

/* exporto la funcion para ser utilizada en otro archivo. */
module.exports = { enviarCorreo };