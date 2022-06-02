/** */
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const nuevoUsuario = async () => {
    try {
        const { data } = await axios.get('https://randomuser.me/api');
        const dataUsuario = data.results[0];

        const objetoUsuario = {
            id: uuidv4().slice(30),
            nombre: `${dataUsuario.name.first} ${dataUsuario.name.last}`,
            correo: dataUsuario.email,
            debe: 0,
            recibe: 0,
        };
        return objetoUsuario;
    } catch (err) {
        console.log("Se ha producido un error al consultar los datos de la API.", err)
        //throw err;
    }
}

const guardarUsuario = async (dataUsuario) => {
    try {
        const usuariosJSON = await JSON.parse(fs.readFileSync("roommates.json", "utf8"))
        usuariosJSON.roommates.push(dataUsuario);
        fs.writeFileSync("roommates.json", JSON.stringify(usuariosJSON, null, 4));
    } catch (err) {
        console.log("Se produjo un error al intentar agregar un nuevo roommate al JSON.", err)
        throw err;
    }
}

const actualizarUsuario = async (gasto) => {
    try {
        let usuariosJSON = await JSON.parse(fs.readFileSync("roommates.json", "utf8"));
        let arregloUsuarios = usuariosJSON.roommates;

        let gastosJSON = await JSON.parse(fs.readFileSync("gastos.json", "utf8"));
        let arregloGastos = gastosJSON.gastos;

        const totalDeRoommates = arregloUsuarios.length;

        arregloUsuarios.forEach(usuario => {
            usuario.recibe = 0;
            usuario.debe = 0;
        });

        arregloUsuarios.forEach(buscarUsuario => {
            arregloGastos.forEach(buscarGasto => {
                if (buscarUsuario.nombre == buscarGasto.roommate) {
                    buscarUsuario.recibe += parseInt(buscarGasto.monto / totalDeRoommates);
                } else {
                    buscarUsuario.debe -= parseInt(buscarGasto.monto / totalDeRoommates);
                }
            })
        });

        fs.writeFileSync("roommates.json", JSON.stringify(usuariosJSON, null, 4));

    } catch (error) {
        console.log("Error al calcular valores de Debe y Recibe.")
    }
}

/* exporto la funcion para ser utilizada por otro archivo. */
module.exports = { nuevoUsuario, guardarUsuario, actualizarUsuario };