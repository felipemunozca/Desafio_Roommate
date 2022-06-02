const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "correopruebafmunoz@gmail.com",
        pass: "Programador2022*",
    },
    tls: {rejectUnauthorized: false}
});

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

module.exports = { enviarCorreo };