
const http = require("http");
const url = require("url");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { nuevoUsuario, guardarUsuario, actualizarUsuario } = require("./roommate");
const { enviarCorreo } = require("./mailer");

http
    .createServer(function (req, res) {
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
            let body;

            req.on("data", (payload) => {
                body = JSON.parse(payload);
            });

            req.on("end", () => {
                try {
                    if (body == undefined) {
                        console.log("Se produjo un error, desde el formulario se ha enviado un payload vacio.");
                    } else if (body.roommate == "" || body.descripcion == "" || body.monto == "") {
                        console.log("Se produjo un error, uno o mas campos del formulario estan vacios.");
                    } else {

                        let objetoGasto = {
                            id: uuidv4().slice(30),
                            roommate: body.roommate,
                            descripcion: body.descripcion,
                            monto: body.monto,
                        };

                        arregloGastos.push(objetoGasto);

                        actualizarUsuario(body.monto);

                        fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON, null, 4));

                        // FUNCION PARA ENVIAR EL CORREO CON CADA GASTO REGISTRADO.
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
    .listen(3000, console.log("Servidor corriendo en http://localhost:3000/"));
