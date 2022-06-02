/** 
 * instalar el paquete axios para llamar a la API.
 * > npm i axios
 * 
 * utilizar el paquete uuid ya instalado.
*/

/* asigno las variables de los paquetes a utilizar. */
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

/* funcion para conectarse a la API y generar un nuevo usuario (roommate). */
const nuevoUsuario = async () => {
    try {
        /* se crea una variable data para desestructurar la api randomuser y pasar los valores de arreglos a distintas variables. */
        const { data } = await axios.get('https://randomuser.me/api');
        const dataUsuario = data.results[0];

        /* se crea un nuevo objeto con los valores de cada roommate. */
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
        throw err;
    }
}

/* Funcion para guardar la informacion del usuario(roommate) en el archivo JSON. */
const guardarUsuario = async (dataUsuario) => {
    try {
        /* Se utiliza file system para leer el archivo roommates.json y pasarle su informacion a un nuevo arreglo. */
        const usuariosJSON = await JSON.parse(fs.readFileSync("roommates.json", "utf8"))
        usuariosJSON.roommates.push(dataUsuario);

        /* Se utiliza file system para escribir la informacion en el roommates.json */
        fs.writeFileSync("roommates.json", JSON.stringify(usuariosJSON, null, 4));
    } catch (err) {
        console.log("Se produjo un error al intentar agregar un nuevo roommate al JSON.", err)
        throw err;
    }
}

/* Funcion para actualizar la informacion del usuario(roommate) en el archivo JSON. */
const actualizarUsuario = async () => {
    try {
        /* se crean nuevas variables para convertir los dos archivos json en arreglos. */
        let usuariosJSON = await JSON.parse(fs.readFileSync("roommates.json", "utf8"));
        let arregloUsuarios = usuariosJSON.roommates;

        let gastosJSON = await JSON.parse(fs.readFileSync("gastos.json", "utf8"));
        let arregloGastos = gastosJSON.gastos;

        /* se crea una variable para almacenar la cantidad de usuarios registrados en roommates.json */
        const totalDeRoommates = arregloUsuarios.length;

        /* se utiliza un forEach para recorrer el arreglo y apuntar a las categorias recibe y debo. */
        /* se igualan a cero en el caso de no tener un valor registrado. */
        arregloUsuarios.forEach(usuario => {
            usuario.recibe = 0;
            usuario.debe = 0;
        });

        /* se crea un forEach que recorre otro forEach para poder obtener resultados de dos arreglos distintos. */
        /* con el primero se busca el nombre del usuario, con el segundo el monto que se agrega como gasto. */
        /* si el nombre se ingresa en el formulario es igual al de un roommate, se le suma el monto dividido la cantidad de usuarios. */
        /* si el nombre no es el que se ingresa en el formulario, se le resta una parte del monto dividido la cantidad de usuarios. */
        arregloUsuarios.forEach(buscarUsuario => {
            arregloGastos.forEach(buscarGasto => {
                if (buscarUsuario.nombre == buscarGasto.roommate) {
                    buscarUsuario.recibe += parseInt(buscarGasto.monto / totalDeRoommates);
                } else {
                    buscarUsuario.debe -= parseInt(buscarGasto.monto / totalDeRoommates);
                }
            })
        });

        /* Se utiliza file system para reescribir la informacion en el roommates.json */
        fs.writeFileSync("roommates.json", JSON.stringify(usuariosJSON, null, 4));

    } catch (error) {
        console.log("Error al calcular valores de Debe y Recibe.")
    }
}

/* exporto las funciones para ser utilizadas en otro archivo. */
module.exports = { nuevoUsuario, guardarUsuario, actualizarUsuario };