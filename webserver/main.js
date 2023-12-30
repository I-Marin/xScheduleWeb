const express = require('express'),
    app = express(),
    cors = require('cors'),
    axios = require('axios'),
    gTTS = require('gtts'),
    fs = require('fs'),
    port = 3000,
    decicatorias_max = 5

const {
    PLAYLIST_CANCIONES,
    PLAYLIST_ANIMACIONES,
    PLAYLIST_SIMON,
    URL_GET_QUEUED_STEPS,
    URL_GET_PLAYING_STATUS,
    URL_CLEAR_BACKGROUND,
    URL_SET_BACKGROUND,
    URL_GET_PLAYLIST_STEPS,
    URL_ENQUEUE_SONG,
    URL_STOP_ANIMATIONS,
    URL_XLIGTHS_COMMAND,
    URL_SET_VOLUME,
    URL_SET_TEST_MODE_ON,
    URL_SET_TEST_MODE_OFF,
    URL_STOP_ALL,
    URL_SIGUIENTE,
    FILE_COMENTARIOS,
    SEPARADOR,
} = require('./constants');

const BASE_URL = require('./baseUrl')

WEB_DATA = {}

WEB_DATA.i = 0
WEB_DATA.lengthms = 0
WEB_DATA.canciones = []
WEB_DATA.cancionesCola = []
WEB_DATA.cancionesSeleccionables = []
WEB_DATA.cancionesEnProceso = [] // Guarda las canciones pendientes de encolar. Para quitarlas de la lista de seleccionables mientras se procesan
WEB_DATA.sonando = ''
WEB_DATA.colaInterna = [] // Aqui se guardan las peticiones de las canciones y los simones dice con datos internos
WEB_DATA.cancionesColaParaWeb = []


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())


app.get('/test_mode_on', (req, res) => {
    console.log(URL_SET_TEST_MODE_ON)
    axios.get(URL_SET_TEST_MODE_ON)
        .then()
        .catch(err => { console.log(err) })
    res.json({
        testmode: on
    })
}
)

app.get('/test_mode_off', (req, res) => {
    console.log(URL_SET_TEST_MODE_OFF)
    axios.get(URL_SET_TEST_MODE_OFF)
        .then()
        .catch(err => { console.log(err) })
    res.json({
        testmode: off
    })
}
)

app.get('/set_volume_to', (req, res) => {
    let action3 = URL_SET_VOLUME(req.query.volumen)
    axios.post(action3)
        .then(() => console.log('Volumen al ' + req.query.volumen + ': ' + action3))
        .catch(e => res.status(500).json({ response: 'No se ha podido modificar volumen: ' + e }))
    res.json({
        volumen: req.query.volumen
    })
}
)

app.get('/stop_all', (req, res) => {
    axios.get(URL_STOP_ALL)
        .then(res.json({ response: 'hecho' }))
        .catch(err => res.json({ error: err.toString() }))

}
)

app.get('/siguiente', (req, res) => {
    axios.get(URL_SIGUIENTE)
        .then(res.json({ response: 'hecho' }))
        .catch(err => res.json({ error: err.toString() }))

}
)

app.get('/canciones', (req, res) => {
    return res.json(
        {
            cancionesCola: WEB_DATA.cancionesColaParaWeb,
            //                           cancionesCola: WEB_DATA.cancionesCola,
            cancionesSinReproducir: WEB_DATA.cancionesSeleccionables,
            cancionesEnProceso: WEB_DATA.cancionesEnProceso,
            lengthms: WEB_DATA.lengthms,
            sonando: WEB_DATA.sonando,
            progreso: WEB_DATA.progreso
        }
    )


    axios.get(URL_GET_QUEUED_STEPS)
        .then(resData => {
            axios.get(URL_GET_PLAYING_STATUS)
                .then(resData2 => {
                    if (resData2.data.status == 'idle') {
                        WEB_DATA.sonando = ''
                        WEB_DATA.progreso = 100
                    }
                    else {
                        WEB_DATA.sonando = '    ' + resData2.data.step + ' ' + resData2.data.left.substring(0, resData2.data.left.indexOf('.', 0))
                        WEB_DATA.progreso = ~~(resData2.data.positionms / resData2.data.lengthms * 100)
                    }
                    if (WEB_DATA.sonando.includes('simon_dice_')) {
                        WEB_DATA.sonando = ''
                        WEB_DATA.progreso = 0
                    }


                    WEB_DATA.lengthms = 0
                    resData.data.steps.forEach(element => {
                        WEB_DATA.lengthms = WEB_DATA.lengthms + parseInt(element.lengthms)
                    });

                    //WEB_DATA.cancionesCola = resData.data.steps.map(step => step.name)
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.canciones.filter(can => !WEB_DATA.cancionesCola.includes(can))
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.cancionesSeleccionables.filter(can => !WEB_DATA.cancionesEnProceso.includes(can))
                    WEB_DATA.cancionesCola = WEB_DATA.cancionesCola.filter(can => !(can == resData2.data.step))

                    WEB_DATA.cancionesColaParaWeb = Array.from(WEB_DATA.cancionesCola)
                    if (WEB_DATA.cancionesCola.length > 0) {
                        if (WEB_DATA.cancionesCola[0].includes("Simon dice ") && WEB_DATA.sonando == '') {
                            // Hay un simon dice jugando
                            WEB_DATA.sonando = WEB_DATA.cancionesCola[0]
                            WEB_DATA.progreso = 0
                            WEB_DATA.cancionesColaParaWeb.shift()
                        }
                    }


                })
                .catch(err => { console.log(err) })
        })
        .catch(err => { })
})

WEB_DATA.secuenciaSimon = []
WEB_DATA.secuenciaJugador = []
WEB_DATA.colors = ['simon_dice_verde', 'simon_dice_rojo', 'simon_dice_amarillo', 'simon_dice_azul', 'simon_dice_ok', 'simon_dice_error']
WEB_DATA.temporizadoresSimon = {}
WEB_DATA.postSimonTimeout = {}

// EJEMPLOS EN CARPETA DE EJEMPLOS
app.get('/simon', (req, res) => {
    var { jugador, nuevaPartida } = req.query
    var partidaString = 'Simon dice ' + jugador
    var index = WEB_DATA.cancionesCola.indexOf(partidaString) // Buscamos el index en el que esta el simon del usuario

    if (index !== -1 && nuevaPartida === "true") {
        return res.status(500).json({ error: 'Ese nombre de jugador ya tiene una partida abierta, por favor seleccione otro nombre de usuario' })
    }

    if (index === -1 && nuevaPartida === "true") { // No existe el simon en la cola, se crea
        WEB_DATA.colaInterna.push(req)
        WEB_DATA.cancionesCola.push(partidaString)
        // Reiniciar o crear un nuevo temporizador para el ID
        setSimonTimer(jugador, 5)
        return res.status(200).json({ status: 'inQueue' })
    } else if (index === -1 || WEB_DATA.postSimonTimeout[jugador]) {
        delete WEB_DATA.postSimonTimeout[jugador]
        return res.status(200).json({ status: 'quit' })
    }
    else if (index === 0 && (WEB_DATA.sonando.length == 0 || WEB_DATA.sonando == partidaString)) { // Si esta en primera posicion y no hay nada sonando
        return res.status(200).json({ status: 'running' })
    } else {
        // Reiniciar o crear un nuevo temporizador para el ID
        setSimonTimer(jugador, 5)
        return res.status(200).json({ status: 'inQueue' })
    }


})

WEB_DATA.timeoutIncrement = 0
app.post('/simon', async (req, res) => {
    var { accion, color, jugador } = req.body
    var colorIndexRandom = Math.floor(Math.random() * 3.999999); // random entre 0 y 3
    var esSecuenciaCorrecta = true
    let saveDirectory = 'C:/xLights/Show2023/secuencias/simon_dice/'

    if (WEB_DATA.cancionesCola.indexOf("Simon dice " + jugador) !== 0) {
        return
    }

    WEB_DATA.timeoutIncrement = 5
    setSimonTimer(jugador, WEB_DATA.timeoutIncrement, true)

    if (accion === 'start') { // Accion que llega cuando llega a la web de los controles del simon dice
        // Si tiene un nombre váldio y no existe una partida con ese mismo nombre se añade la petición a la cola
        WEB_DATA.secuenciaSimon = []
        WEB_DATA.secuenciaJugador = []
        WEB_DATA.secuenciaSimon.push(WEB_DATA.colors[colorIndexRandom])
        console.log("[simon dice]: " + WEB_DATA.secuenciaSimon)
        await encolarCancion('simon_dice_inicio', true)
        // encolamos la primera
        for (let i = 0; i < WEB_DATA.secuenciaSimon.length; i++) {
            let cancion = WEB_DATA.secuenciaSimon[i] + '_' + (i + 1)
            await encolarCancion(cancion, true)
        }
        setSimonTimer(jugador, 20, true)
    } else if (accion === 'select') { // Se captura la secuencia y se compara con la que hace simon
        WEB_DATA.secuenciaJugador.push(color)
        for (let i = 0; i < WEB_DATA.secuenciaJugador.length; i++) {
            if (WEB_DATA.secuenciaJugador[i] !== WEB_DATA.secuenciaSimon[i]) {
                esSecuenciaCorrecta = false
                break
            }
        }

        if (esSecuenciaCorrecta === false) {
            WEB_DATA.secuenciaSimon = []
            console.log("[simon dice] Secuencia fallada " + jugador)

            // Grabo el log de puntuacion
            txt = saveDirectory + 'simon_dice.txt'
            let now = new Date();
            let logg = WEB_DATA.secuenciaJugador.length - 1
            fs.appendFileSync(txt, now + ' ' + logg + ' aciertos ' + ' ' + jugador + '\n')

            // TODO: Guardar record

            setSimonTimer(jugador, 0, true)

            // Se ejecuta secuencia de error
            await encolarCancion('simon_dice_error', true)

        } else {
            console.log("[" + jugador + " dice]: " + WEB_DATA.secuenciaJugador)
            // Se ejecuta el color seleccionado por el jugador
            let cancionJ = color + '_' + (WEB_DATA.secuenciaJugador.length + 2)
            await encolarCancion(cancionJ, true)

            if (WEB_DATA.secuenciaJugador.length === WEB_DATA.secuenciaSimon.length) {
                // Secuencia entera correcta
                WEB_DATA.secuenciaJugador = []
                WEB_DATA.secuenciaSimon.push(WEB_DATA.colors[colorIndexRandom])
                console.log("[simon dice]: " + WEB_DATA.secuenciaSimon)
                // Se ejecuta la secuencia de OK
                await encolarCancion('simon_dice_ok', true)

                // se ejecuta la secuencia de colores entera
                for (let i = 0; i < WEB_DATA.secuenciaSimon.length; i++) {
                    let cancion = WEB_DATA.secuenciaSimon[i] + '_' + (i + 1)
                    await encolarCancion(cancion, true)
                }
                WEB_DATA.timeoutIncrement = 10 + 1 * (WEB_DATA.secuenciaSimon.length + 1)
                setSimonTimer(jugador, WEB_DATA.timeoutIncrement, true)

            } else { // Secuencia acertada pero no completa
                // Esperando pulsacion del jugador
            }

        }
    } else {
        esSecuenciaCorrecta = false
    }


    return res.status(200).json({ esSecuenciaCorrecta: esSecuenciaCorrecta, cantidadColores: WEB_DATA.secuenciaSimon.length })
})


function setSimonTimer(jugador, segundos, post) {
    clearTimeout(WEB_DATA.temporizadoresSimon[jugador]);
    WEB_DATA.temporizadoresSimon[jugador] = setTimeout(() => {
        // Acción a realizar cuando se alcanza el timeout
        console.log(`Timeout para persona ${jugador}, se cierra su partida porque ha pasado mas de ${segundos} segundos sin recibir una llamada`);

        WEB_DATA.colaInterna = WEB_DATA.colaInterna.filter(elem => elem.query.jugador !== jugador) // Eliminamos al jugador porque se ha desconectado
        WEB_DATA.cancionesCola = WEB_DATA.cancionesCola.filter(elem => elem !== 'Simon dice ' + jugador)
        if (post) {
            WEB_DATA.postSimonTimeout[jugador] = true
            WEB_DATA.secuenciaSimon = []
        }
        WEB_DATA.timeoutIncrement = 0
        delete WEB_DATA.temporizadoresSimon[jugador]

        //TODO: Encolar todas las peticiones hasta el siguiente simon dice
        let reqEncolar
        while (WEB_DATA.colaInterna.length > 0 && WEB_DATA.colaInterna[0].body.cancion) {
            reqEncolar = WEB_DATA.colaInterna.shift()
            encolarCancionDedicatoriaPost(reqEncolar)

        }



    }, segundos * 1000); // segundos de timeout
}

app.post('/canciones', (req, res) => {
    let body = req.body
    let cancion = body.cancion

    // let ahora = new Date();
    // if (ahora.getHours() < 18 || (ahora.getHours() == 18 && ahora.getMinutes() < 30) || (ahora.getHours() == 21 && ahora.getMinutes() > 30) || ahora.getHours() >= 22) {
    //     return res.status(500).json({ response: 'Solo se puede seleccionar canciones de 18:30 a 21:30, ¡Vente a esas horas y disfruta del espectáculo! ;)' })
    // }
    // if (WEB_DATA.cancionesCola.length >= CANCIONES_max)
    //     return res.status(100).json({ response: 'No se pueden añadir más canciones a la cola, hay que esperar a que termine alguna' })   
    // if (WEB_DATA.lengthms >= 5 * 60 * 1000)
    //     return res.status(500).json({ message: 'Ya hay mas de 5 minutos de canciones, hay que esperar a que termine alguna' })

    WEB_DATA.cancionesCola.push(cancion) // Metemos la cancion en cola para que se muestre en la web
    if (WEB_DATA.cancionesCola.filter(elemCola => elemCola.includes('Simon dice ')).length > 0) {
        WEB_DATA.colaInterna.push(req) // Metemos el object de la peticion para hacerla cuando no haya simones en cola
        return
    }

    encolarCancionDedicatoriaPost(req)
})

function encolarCancionDedicatoriaPost(req) {
    let body = req.body
    let cancion = body.cancion

    if (!WEB_DATA.canciones.includes(cancion))
        return res.status(500).json({ response: 'La canción no se encuentra en la playlist' })

    WEB_DATA.cancionesEnProceso.push(cancion)

    let dedicatoria = body.dedicatoria != '' ? body.dedicatoria : undefined,
        saveDirectory = 'C:/xLights/Show2023/secuencias/',
        fileName
    // Guardo el historico de canciones
    txt = saveDirectory + 'canciones.txt'
    let now = new Date();
    fs.appendFileSync(txt, now + ' ' + cancion + '\n')

    if (dedicatoria) {
        if (WEB_DATA.i >= decicatorias_max)
            WEB_DATA.i = 0

        fileName = `dedicatoria${++WEB_DATA.i}`
        let seq = 'secuencias/' + fileName + '.xsq'
        let mp3 = saveDirectory + fileName + '.mp3'
        let txt = saveDirectory + fileName + '.txt'
        console.log('DEDICATORIA: ' + dedicatoria + '\nARCHIVO: ' + fileName + '\n')
        new gTTS('La siguiente canción tiene esta dedicatoria: ' + dedicatoria, 'es')
            .save(mp3, (err, result) => {
                if (err)
                    return console.log(err)
                fs.writeFileSync(txt, dedicatoria.toUpperCase())
                // Guardo el historico de dedicatorias
                txt = saveDirectory + 'dedicatorias.txt'
                let now = new Date();
                fs.appendFileSync(txt, now + ' ' + dedicatoria + '\n')


                // Abro la secuencia
                err = ''
                let action1 = URL_XLIGTHS_COMMAND('openSequence' + '?force=False&seq=' + seq)
                axios.get(action1)
                    .then(() => {
                        // Renderizo
                        let action2 = URL_XLIGTHS_COMMAND('renderAll')
                        axios.get(action2)
                            .then(() => {
                                // Guardo la secuencia
                                let action3 = URL_XLIGTHS_COMMAND('saveSequence')
                                axios.get(action3)
                                    .then(() => {
                                        let action4 = URL_XLIGTHS_COMMAND('closeSequence')
                                        axios.get(action4)
                                            .then(() => {
                                                let action5 = URL_ENQUEUE_SONG(fileName, 'DEDICATORIAS')
                                                axios.post(action5)
                                                    .then(() => {
                                                        console.log('Dedicatoria añadida: ' + dedicatoria)
                                                        WEB_DATA.cancionesCola.push(cancion)
                                                        WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                                                        encolarCancion(cancion)
                                                    }) //then5
                                                    .catch(e => {
                                                        console.log('No se ha podido añadir la secuencia\n' + ':\n ' + e)
                                                        WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                                                        encolarCancion(cancion)
                                                    }) //catch5
                                            }) //then4
                                            .catch(e => {
                                                console.log('Error ' + action4 + ':\n ' + e + '\n\n')
                                                WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                                                encolarCancion(cancion)
                                            }) //catch4
                                    }) //then3
                                    .catch(e => {
                                        console.log('Error ' + action3 + ':\n ' + e + '\n\n')
                                        WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                                        encolarCancion(cancion)
                                    }) //catch3
                            }) //then2
                            .catch(e => {
                                console.log('Error ' + action2 + ':\n ' + e + '\n\n')
                                WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                                encolarCancion(cancion)
                            }) //catch2
                    }) //then1
                    .catch(e => {
                        console.log('Error ' + action1 + ':\n ' + e + '\n\n')
                        WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
                        encolarCancion(cancion)
                    }) //catch1
            }); // gTTS de la dedicatoria

        // var waitTill = new Date(new Date().getTime() + 1 * 1000);
        // // while (waitTill > new Date()) { }
        // // console.log('Waited 1 s')





    } else { // No hay dedicatoria
        WEB_DATA.cancionesEnProceso = WEB_DATA.cancionesEnProceso.filter(c => c != cancion)
        encolarCancion(cancion)
    }
}

async function encolarCancion(cancion, esSimon) {
    var playlist = !esSimon ? PLAYLIST_CANCIONES : PLAYLIST_SIMON
    try {
        // WEB_DATA.cancionesEnProceso = [] //WEB_DATA.cancionesEnProceso.filter(c => c != cancion)

        let action1 = URL_ENQUEUE_SONG(cancion, playlist)
        await axios.post(action1)
        if (esSimon != true) {
            console.log('Canción añadida a la cola: ' + cancion)
        }
        // // Paro el background
        // let action2 = URL_CLEAR_BACKGROUND
        // axios.post(action2)
        //     .then(() => console.log('Parado el background: ' + action2))
        //     .catch(e => res.status(500).json({ response: 'No se han podido parar las animaciones: ' + e }))


        // let action3 = URL_SET_VOLUME(50)
        // axios.post(action3)
        //     .then(() => console.log('Volumen al 50: ' + action3))
        //     .catch(e => res.status(500).json({ response: 'No se ha podido modificar volumen: ' + e }))
    } catch (error) {
        console.log('Error encolando cancion : ' + error);
    }

}

app.get('/renderall', (req, res) => {

    renderSongsFromArray([
        'secuencias/All I Want For Christmas is You.xsq',
        'secuencias/Animacion1.xsq',
        'secuencias/Animacion2.xsq',
        'secuencias/Animacion3.xsq',
        'secuencias/Animacion4.xsq',
        'secuencias/Animacion5.xsq',
        'secuencias/Animacion6.xsq',
        'secuencias/Animacion7.xsq',
        'secuencias/Animacion8.xsq',
        'secuencias/Animacion9.xsq',
        'secuencias/Animacion10.xsq',
        'secuencias/Animacion11.xsq',
        'secuencias/Campanadas.xsq',
        'secuencias/Cant stop the feeling.xsq',
        'secuencias/Christmas Tecno Mix.xsq',
        'secuencias/Crystalize - Christmas on Runway.xsq',
        'secuencias/Cuento de navidad.xsq',
        'secuencias/Cumpleaños Feliz.xsq',
        'secuencias/dedicatoria1.xsq',
        'secuencias/dedicatoria2.xsq',
        'secuencias/dedicatoria3.xsq',
        'secuencias/El Tamborilero - Rafael.xsq',
        'secuencias/Frosty the Snowman.xsq',
        'secuencias/Happy Christmas.xsq',
        'secuencias/Here Comes Santa Claus.xsq',
        'secuencias/Inicio Show.xsq',
        'secuencias/Let It Snow.xsq',
        'secuencias/Los peces en el rio.xsq',
        'secuencias/marruecos.xsq',
        'secuencias/Michael Jackson Mix.xsq',
        'secuencias/Noche de paz.xsq',
        'secuencias/Blanca Navidad - La Oreja de Van Gogh.xsq',
        'secuencias/Pentatonix Carol of the bells.xsq',
        'secuencias/Phineas and Ferb - Winter Vacation.xsq',
        'secuencias/Ping Pong Christmas.xsq',
        'secuencias/Show830.xsq',
        'secuencias/Star Wars.xsq'
    ])
    return res.status(500).json({ response: 'Renderizando' })
})

app.get('/comentarios', (req, res) => {
    let comentarios = fs.readFileSync(FILE_COMENTARIOS, { encoding: 'utf-8' })
    comentarios = comentarios.split(SEPARADOR)
    let comentariosValidados = []
    comentarios.forEach(c => {
        let err = false
        try {
            c = JSON.parse(c)
            // console.log(c)
            for (let property in c) {
                if (property !== 'nombre' && property !== 'comentario' && property !== 'estrellas' && property !== 'date')
                    err = true
                if (property === 'estrellas' && parseInt(c[property]) > 5)
                    c[property] = '5'
            }
        } catch (error) { err = true }

        if (!err)
            comentariosValidados.push(c)
    })
    // console.log(comentariosValidados)
    res.json({ comentarios: comentariosValidados })
})

app.post('/comentarios', (req, res) => {
    // console.log(req.body)
    let request = req.body
    request.date = new Date()
    fs.appendFileSync(FILE_COMENTARIOS, JSON.stringify(request) + SEPARADOR)
    res.redirect(`http://micasasevedelejos.tudelanicos.com:31500/xScheduleWeb/comentarios.html`)
})

// Temporizador para poner ANIMACIONES
function startBackground() {
    //console.log('Background timer')


    // Busco el estado del Scheduler
    axios.get(URL_GET_PLAYING_STATUS)
        .then(resData => {
            if (resData.data.status == 'idle' && WEB_DATA.secuenciaSimon.length <= 0) {
                // Pongo las animaciones
                let action = URL_SET_BACKGROUND(PLAYLIST_ANIMACIONES)
                axios.post(action)
                    .then(() => { })
                    .catch(e => res.status(500).json({ response: 'No se han podido parar las animaciones: ' + e }))
            }

        })
        .catch(err => { console.log(err) })

}


// Temporizador para ver cancion sonando, y modificar colas
function procesaColas() {

    axios.get(URL_GET_QUEUED_STEPS)
        .then(resData => {
            axios.get(URL_GET_PLAYING_STATUS)
                .then(resData2 => {
                    if (resData2.data.status == 'idle') {
                        WEB_DATA.sonando = ''
                        WEB_DATA.progreso = 100
                    }
                    else {
                        WEB_DATA.sonando = '    ' + resData2.data.step + ' ' + resData2.data.left.substring(0, resData2.data.left.indexOf('.', 0))
                        WEB_DATA.progreso = ~~(resData2.data.positionms / resData2.data.lengthms * 100)
                    }
                    if (WEB_DATA.sonando.includes('simon_dice_')) {
                        WEB_DATA.sonando = ''
                        WEB_DATA.progreso = 0
                    }


                    WEB_DATA.lengthms = 0
                    resData.data.steps.forEach(element => {
                        WEB_DATA.lengthms = WEB_DATA.lengthms + parseInt(element.lengthms)
                    });

                    //WEB_DATA.cancionesCola = resData.data.steps.map(step => step.name)
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.canciones.filter(can => !WEB_DATA.cancionesCola.includes(can))
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.cancionesSeleccionables.filter(can => !WEB_DATA.cancionesEnProceso.includes(can))
                    WEB_DATA.cancionesCola = WEB_DATA.cancionesCola.filter(can => !(can == resData2.data.step))

                    WEB_DATA.cancionesColaParaWeb = Array.from(WEB_DATA.cancionesCola)
                    if (WEB_DATA.cancionesCola.length > 0) {
                        if (WEB_DATA.cancionesCola[0].includes("Simon dice ") && WEB_DATA.sonando == '') {
                            // Hay un simon dice jugando
                            WEB_DATA.sonando = WEB_DATA.cancionesCola[0]
                            WEB_DATA.progreso = 0
                            WEB_DATA.cancionesColaParaWeb.shift()
                        }
                    }
                })
                .catch(err => { console.log(err) })
        })
        .catch(err => { })

}

function renderizarCancion(cancion) {
    let action1 = URL_XLIGTHS_COMMAND('openSequence' + '?force=False&seq=' + cancion)
    console.log(action1)
    axios.get(action1)
        .then(r => {
            // Renderizo
            let action2 = URL_XLIGTHS_COMMAND('renderAll')
            console.log(action2)
            axios.get(action2)
                .then(r => {
                    // Guardo la secuencia
                    let action3 = URL_XLIGTHS_COMMAND('saveSequence')
                    console.log(action3)
                    axios.get(action3)
                        .then(r => {
                            let action4 = URL_XLIGTHS_COMMAND('closeSequence')
                            return axios.get(action4)
                                .then(console.log('Cerrada'))
                                .catch(e => {
                                    console.log('Error ' + action4 + ':\n ' + e + '\n\n')
                                })
                        })
                        .catch(e => {
                            console.log('Error ' + action3 + ':\n ' + e + '\n\n')
                        })
                })
                .catch(e => {
                    console.log('Error ' + action2 + ':\n ' + e + '\n\n')
                })
        })
        .catch(e => {
            console.log('Error ' + action1 + ':\n ' + e + '\n\n')
        })
}

async function renderizarCancion_async(cancion) {
    let action1 = URL_XLIGTHS_COMMAND('openSequence' + '?force=False&seq=' + cancion)
    console.log(action1)
    await axios.get(action1)
    let action2 = URL_XLIGTHS_COMMAND('renderAll')
    console.log(action2 + ' ' + cancion)
    await axios.get(action2)
    let action3 = URL_XLIGTHS_COMMAND('saveSequence')
    console.log(action3 + ' ' + cancion)
    await axios.get(action3)
    let action4 = URL_XLIGTHS_COMMAND('closeSequence')
    console.log(action4 + ' ' + cancion)
    await axios.get(action4)
}

const renderSongsFromArray = songsNameArray => {
    if (songsNameArray.length <= 0)
        return

    renderizarCancion_async(songsNameArray[0])
        .then(() => {
            songsNameArray.shift() // Eliminamos el primer valor del array
            renderSongsFromArray(songsNameArray)
        })
}

function mapListByParam(list, params) {
    let paramsSplitted = params.split('.')
    if (paramsSplitted.length > 1) {
        return mapListByParam(
            list.map(elem => elem[paramsSplitted[0]]).filter(elem => elem !== undefined),
            paramsSplitted.filter((value, index) => index !== 0).join('.')
        )
    } else {
        return list.map(elem => elem[params[0]]).filter(elem => elem !== undefined)
    }
}

// Encolamos canciones cada 1 segundo por si se han quedado paradas
/*setInterval(() => {
    axios.get(URL_GET_QUEUED_STEPS)
        .then(resData => {
            axios.get(URL_GET_PLAYING_STATUS)
                .then(resData2 => {

                    var cancionSonando = resData2.data.step
                    encolarCancion(elementoCola)

                    var elementoColaInterna = WEB_DATA.colaInterna.map(elem => elem.body.cancion)
                    // Encolamos solo hasta que nos encontremos un simon, que con el map el elemento se quedara en undefined
                    for (let elementoCola in elementoColaInterna) {
                        if (elementoCola === undefined ) {
                            return
                        }
                    }
                
                    //WEB_DATA.cancionesCola = resData.data.steps.map(step => step.name)
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.canciones.filter(can => !WEB_DATA.cancionesCola.includes(can))
                    WEB_DATA.cancionesSeleccionables = WEB_DATA.cancionesSeleccionables.filter(can => !WEB_DATA.cancionesEnProceso.includes(can))
                })
                .catch(err => { console.log(err) })
        })
        .catch(err => { })
}, 1000)*/

app.listen(port, () => {
    axios.get(URL_GET_PLAYLIST_STEPS)
        .then(res => WEB_DATA.canciones = res.data.steps.map(step => step.name))
        .catch(err => console.log(err))
    console.log(`Marin Falcon app listening on http://${BASE_URL(port)}`)
    console.log(`Página de canciones: http://${BASE_URL()}/xScheduleWeb/index.html`)
    console.log(`Página de comentarios: http://${BASE_URL()}/xScheduleWeb/comentarios.html`)

    setInterval(startBackground, 5000, 'funky');
    setInterval(procesaColas, 500, 'funky2');
})