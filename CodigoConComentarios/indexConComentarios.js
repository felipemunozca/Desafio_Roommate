/**
 * inicializar el proyecto con npm
 * > npm init -y
 * 
 * instalar el paquete nodemon como dependencia de desarrollo
 * > npm i nodemon -D
 * 
 * levantar el servidor utilizando nodemon
 * > npx nodemon index.js
 * 
 * se crea un nuevo archivo roommates.json el cual sera una especie de base de datos donde se almacenaran los resultados de la 
 * interaccion con el formulario. Seran ingresados dentro del array "roommates": []
 * 
 * se crea un nuevo archivo gastos.json el cual sera una especie de base de datos donde se almacenaran los resultados de la 
 * interaccion con el formulario. Seran ingresados dentro del array "gastos": []
 * 
 * instalar el paquete uuid para generar id unicos para cada comida
 * > npm i uuid
 */

/* se asignan las variables de los paquetes a utilizar. */
const http = require("http");
const url = require("url");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/* se llaman a las funciones exportadas en otros archivos JS. */
const { nuevoUsuario, guardarUsuario, actualizarUsuario } = require("./roommate");
const { enviarCorreo } = require("./mailer");

/* se crea el servidor. */
http
    .createServer(function (req, res) {

        /* Se crea una nueva variable para pasarle la lectura del gastos.json parseado */
        /* Luego el resultado del json se convierte en un arreglo. */
        /* Se repite la opacion con roommates.json. */
        let gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf8"));
        let arregloGastos = gastosJSON.gastos;

        let usuariosJSON = JSON.parse(fs.readFileSync("roommates.json", "utf8"));
        let arregloUsuarios = usuariosJSON.roommates;

        // RUTA RAIZ DEL PROYECTO PARA CARGAR EL INDEX.HTML
        if (req.url == "/" && req.method == "GET") {
            res.setHeader("Content-Type", "text/html");
            res.statusCode = 200;
            res.end(fs.readFileSync("index.html"));
        }
        
        // LISTAR TODOS LOS USUARIOS DEL JSON.
        /* Se define por la cabecera que el archivo que se esta pidiendo es de tipo JSON. */
        /* Si la ruta es correcta, se le asigna un codigo de estado 200 que indica que la solicitud ha tenido exito. */
        /* Si no se encuentra la ruta, se le asigna el codigo de estado 500 que indica que hay errores del lado del servidor. */
        else if (req.url == "/roommates" && req.method == "GET") {
            try {
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 200;
                res.end(fs.readFileSync("roommates.json", "utf8"));
            } catch (error) {
                console.log("Se produjo un Error al intentar obtener el listado de roommates.");
                console.log(error);
                res.statusCode = 500;
                res.end();
            }
        }
        
        // AGREGAR UN NUEVO USUARIO AL JSON roommates.json
        /* Se utiliza una promesa para obtener los datos del roommate en nuevoUsuario() y luego cargarlos al json con guardarUsuario() */
        /* Se asigna un codigo de estado 201 para indicar que la solicitud ha tenido éxito y se ha creado un nuevo recurso. */
        /* Se termina la comunicacion con res.end() y se le pasa como parametro, usuario que es un json convertido en string. */
        else if (req.url == "/roommate" && req.method == "POST") {
            nuevoUsuario()
                .then(async (usuario) => {
                    guardarUsuario(usuario);
                    res.statusCode = 201;
                    res.end(JSON.stringify(usuario))
                })
                .catch(error => {
                    res.statusCode = 500;
                    console.log("Se produjo un Error al intentar registrar un nuevo usuario", error)
                });
        }

        // LISTAR TODOS LOS GASTOS DEL JSON.
        else if (req.url == "/gastos" && req.method == "GET") {
            try {
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 200;
                res.end(fs.readFileSync("gastos.json", "utf8"));
            } catch (error) {
                console.log("Se produjo un Error al intentar obtener el listado de gastos.", error);
                res.statusCode = 500;
                res.end();
            }
        }

        // AGREGAR UN NUEVO GASTO AL JSON gastos.json
        else if (req.url == "/gasto" && req.method == "POST") {
            /* Se crea una nueva variable llamada "body". 
            Este nombre se debe a que hace referencia a la informacion viene en el cuerpo del documento */
            let body;

            /* Se utiliza el metodo .on() para que se active cuando en el request llegue una data. Como callback recibira un payload. */
            /* La informacion del payload debe ser parseada antes de pasarse a la variable body. */
            req.on("data", (payload) => {
                body = JSON.parse(payload);
            });

            req.on("end", () => {
                try {
                    /* Se agregan validaciones para el formulario. */
                    if (body == undefined) {
                        console.log("Se produjo un error, desde el formulario se ha enviado un payload vacio.");
                    } else if (body.roommate == "" || body.descripcion == "" || body.monto == "") {
                        console.log("Se produjo un error, uno o mas campos del formulario estan vacios.");
                    } else {

                        /* Se crea un nuevo objeto en el que se define el formato que se guardara en el JSON. */
                        let objetoGasto = {
                            id: uuidv4().slice(30),
                            roommate: body.roommate,
                            descripcion: body.descripcion,
                            monto: body.monto,
                        };

                        /* Se sube la informacion del objeto dentro del arreglo. */
                        arregloGastos.push(objetoGasto);

                        /* Se llama a la funcion actualizar para pasarle el monto al momento de agregar un nuevo gasto. */
                        actualizarUsuario(body.monto);

                        /* Se utiliza file system para escribir la informacion en el  archivo gastos.json  */
                        /* para ordenar la informacion en el archivo json, se le paso los parametros "null" para evitar que 
                        se reemplace algo del contenido, y el parametro "4" que sera el tamaño de la identacion que tendra el archivo. */
                        fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON, null, 4));

                        // FUNCION PARA ENVIAR EL CORREO CON CADA GASTO REGISTRADO.
                        /* se crean las variables que se enviaran a la funcion en el archivo mailer.js */
                        /* Los valores de cada variable seran individuales, salvo los correos, que seran un arreglo de todos los correos de los usuarios. */
                        let nombre = body.roommate;
                        let descripcion = body.descripcion;
                        let monto = body.monto;
                        let correos = arregloUsuarios.map((e) => e.correo);

                        enviarCorreo(nombre, descripcion, monto, correos)
                            .then((result) => {
                                console.log("Estado del correo", result)
                                res.end();
                            })
                            .catch((e) => {
                                res.statusCode = 500;
                                res.end();
                                console.log("Error en el envío de correo", e);
                            });

                        res.statusCode = 201;
                        res.end();
                    }
                } catch (error) {
                    console.log("Se produjo un Error al intentar registrar un nuevo gasto.")
                    console.log(error);
                    res.statusCode = 500;
                    res.end();
                }
            });
        }

        // ACTUALIZAR UN GASTO DE LA LISTA.
        else if (req.url.startsWith("/gasto") && req.method == "PUT") {
            let body;

            const { id } = url.parse(req.url, true).query;
            
            req.on("data", (payload) => {
                body = JSON.parse(payload);
                body.id = id;
            });

            req.on("end", () => {
                try {
                    if (body == undefined) {
                        console.log("Se produjo un error, desde el formulario se ha enviado un payload vacio.");
                    } else if (body.roommate == "" || body.descripcion == "" || body.monto == "") {
                        console.log("Se produjo un error, uno o mas campos del formulario estan vacios.");
                    } else {

                        gastosJSON.gastos = arregloGastos.map((gasto) => {
                            if (gasto.id == body.id) {
                                gasto.roommate = body.roommate;
                                gasto.descripcion = body.descripcion;
                                gasto.monto = body.monto;
                            }
                            return gasto;
                        });

                        actualizarUsuario();

                        fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON, null, 4));

                        res.statusCode = 201;
                        res.end(); 
                    }
                } catch (error) {
                    console.log("Se produjo un Error al intentar actualizar un nuevo gasto.")
                    console.log(error);
                    res.statusCode = 500;
                    res.end();
                }
                
            });
        }

        // ELIMINAR UN GASTO DE LA LISTA.
        else if (req.url.startsWith("/gasto") && req.method == "DELETE") {
            try {
                const { id } = url.parse(req.url, true).query;
                gastosJSON.gastos = arregloGastos.filter((gasto) => gasto.id != id);

                actualizarUsuario();

                fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON, null, 4));

                res.statusCode = 200;
                res.end();
            } catch (error) {
                console.log("Se produjo un Error al intentar eliminar un gasto de la lista.")
                console.log(error);
                res.statusCode = 500;
                res.end();
            }
        }

        // OPCION POR SI NO SE CUMPLE NINGUNA DE LAS OTRAS RUTAS. 
        else {
            res.statusCode = 404;
            res.write("Error 404.\nPagina no encontrada.");
            res.end();
        }

    })
    /* se levanta el servidor en el puerto 3000. */
    .listen(3000, console.log("Servidor corriendo en http://localhost:3000/"));