const express = require('express'),
    app = express(),
    cors = require('cors'),
    axios = require('axios'),
    gTTS = require('gtts'),
    fs = require('fs'),
    port = 3000,
    decicatorias_max = 5

const PLAYLIST_CANCIONES = 'CANCIONES',
    PLAYLIST_ANIMACIONES = 'ANIMATIONS',
    URL_GET_QUEUED_STEPS = 'http://192.168.1.99:31500/xScheduleQuery?Query=GetQueuedSteps',
    URL_GET_PLAYING_STATUS = 'http://192.168.1.99:31500/xScheduleQuery?Query=GetPlayingStatus',
    URL_CLEAR_BACKGROUND = 'http://192.168.1.99:31500/xScheduleCommand?Command=Clear background playlist',
    URL_SET_BACKGROUND = playlist => 'http://192.168.1.99:31500/xScheduleCommand?Command=Set playlist as background&Parameters=' + playlist,
    URL_GET_PLAYLIST_STEPS = 'http://192.168.1.99:31500/xScheduleQuery?Query=GetPlayListSteps&Parameters=' + PLAYLIST_CANCIONES,
    URL_ENQUEUE_SONG = (songName, playlist) => 'http://192.168.1.99:31500/xScheduleCommand?Command=Enqueue playlist step&Parameters=' + playlist + ',' + songName,
    URL_STOP_ANIMATIONS = playlist => 'http://192.168.1.99:31500/xScheduleCommand?Command=Stop specified playlist&Parameters=' + playlist,
    URL_XLIGTHS_COMMAND = command => 'http://192.168.1.99:49913/' + command,
    URL_SET_VOLUME = volumen => 'http://192.168.1.99:31500/xScheduleCommand?Command=Set volume to&Parameters=' + volumen,
    FILE_COMENTARIOS = './comentarios.txt',
    SEPARADOR = ';\n'


this.i = 0
this.lengthms = 0
this.canciones = []
this.cancionesCola = []
this.cancionesSeleccionables = []
this.cancionesEnProceso = [] // Guarda las canciones pendientes de encolar. Para quitarlas de la lista de seleccionables mientras se procesan
this.sonando = ''


app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(cors())



app.get('/canciones', (req, res) => {
    axios.get(URL_GET_QUEUED_STEPS)
        .then(resData => {
            axios.get(URL_GET_PLAYING_STATUS)
                .then(resData2 => {
                    if (resData2.data.status == 'idle') {
                        this.sonando = 'PUEDES ELEGIR LA PRÓXIMA CANCIÓN'
                        this.progreso = 100
                    }
                    else {
                        this.sonando = '    ' + resData2.data.step + ' ' + resData2.data.left.substring(0, resData2.data.left.indexOf('.', 0))
                        this.progreso = ~~(resData2.data.positionms / resData2.data.lengthms * 100)
                    }

                    this.lengthms = 0
                    resData.data.steps.forEach(element => {
                        this.lengthms = this.lengthms + parseInt(element.lengthms)
                    });
                    this.cancionesCola = resData.data.steps.map(step => step.name)
                    this.cancionesSeleccionables = this.canciones.filter(can => !this.cancionesCola.includes(can))
                    this.cancionesSeleccionables = this.cancionesSeleccionables.filter(can => !this.cancionesEnProceso.includes(can))
                    this.cancionesCola = this.cancionesCola.filter(can => !(can == resData2.data.step))

                    res.json(
                        {
                            cancionesCola: this.cancionesCola,
                            cancionesSinReproducir: this.cancionesSeleccionables,
                            cancionesEnProceso: this.cancionesEnProceso,
                            lengthms: this.lengthms,
                            sonando: this.sonando,
                            progreso: this.progreso
                        }
                    )
                })
                .catch(err => { console.log(err) })
        })
        .catch(err => { })
})

app.post('/canciones', (req, res) => {
    let body = JSON.parse(req.body)
    let cancion = body.cancion

    // let ahora = new Date();
    // if (ahora.getHours() < 18 || (ahora.getHours() == 18 && ahora.getMinutes() < 30) || (ahora.getHours() == 21 && ahora.getMinutes() > 30) || ahora.getHours() >= 22) {
    //     return res.status(500).json({ response: 'Solo se puede seleccionar canciones de 18:30 a 21:30, ¡Vente a esas horas y disfruta del espectáculo! ;)' })
    // }
    if (!this.canciones.includes(cancion))
        return res.status(500).json({ response: 'La canción no se encuentra en la playlist' })
    // if (this.cancionesCola.length >= CANCIONES_max)
    //     return res.status(100).json({ response: 'No se pueden añadir más canciones a la cola, hay que esperar a que termine alguna' })   
    // if (this.lengthms >= 5 * 60 * 1000)
    //     return res.status(500).json({ message: 'Ya hay mas de 5 minutos de canciones, hay que esperar a que termine alguna' })

    this.cancionesEnProceso.push(cancion)

    let dedicatoria = body.dedicatoria != '' ? body.dedicatoria : undefined,
        saveDirectory = 'C:/xLights/Show2022/secuencias/',
        fileName
    // Guardo el historico de canciones
    txt = saveDirectory + 'canciones.txt'
    let now = new Date();
    fs.appendFileSync(txt, now + ' ' + cancion + '\n')

    if (dedicatoria) {
        if (this.i >= decicatorias_max)
            this.i = 0

        fileName = `dedicatoria${++this.i}`
        let seq = 'secuencias/' + fileName + '.xsq'
        let mp3 = saveDirectory + fileName + '.mp3'
        let txt = saveDirectory + fileName + '.txt'
        console.log('DEDICATORIA: ' + dedicatoria + '\nARCHIVO: ' + fileName + '\n')
        new gTTS(dedicatoria, 'es')
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
                                    this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                                    encolarCancion(cancion)
                                })
                                .catch(e => {
                                    console.log('No se ha podido añadir la secuencia\n' + ':\n ' + e)
                                    this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                                    encolarCancion(cancion)
                                })
                                .catch(e => {
                                    console.log('Error ' + action4 + ':\n ' + e + '\n\n')
                                    this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                                    encolarCancion(cancion)
                                })
                            })
                            .catch(e => {
                                console.log('Error ' + action3 + ':\n ' + e + '\n\n')
                                this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                                encolarCancion(cancion)
                            })
                        })
                            .catch(e => {
                                console.log('Error ' + action2 + ':\n ' + e + '\n\n')
                                this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                                encolarCancion(cancion)
                            })
                    })
                    .catch(e => {
                        console.log('Error ' + action1 + ':\n ' + e + '\n\n')
                        this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
                        encolarCancion(cancion)
                    })
                })

            }); // gTTS de la dedicatoria

        // var waitTill = new Date(new Date().getTime() + 1 * 1000);
        // // while (waitTill > new Date()) { }
        // // console.log('Waited 1 s')





    } else { // No hay dedicatoria
        this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
        encolarCancion(cancion)
    }


    function encolarCancion(cancion) {
        try {
            // this.cancionesEnProceso = [] //this.cancionesEnProceso.filter(c => c != cancion)

            let action1 = URL_ENQUEUE_SONG(cancion, PLAYLIST_CANCIONES)
            axios.post(action1)
                .then(() => {
                    console.log('Canción añadida a la cola: ' + cancion)
                })
                .catch(e => res.status(500).json({ response: 'No se ha podido añadir a la cola la canción: ' + e }))

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

})

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

    /*
    renderizarCancion_async('secuencias/All I Want For Christmas is You.xsq')
    .then(renderizarCancion_async('secuencias/Animacion1.xsq')
    .then(renderizarCancion_async('secuencias/Animacion2.xsq')
    .then(renderizarCancion_async('secuencias/Animacion3.xsq')
    .then(renderizarCancion_async('secuencias/Animacion4.xsq')
    .then(renderizarCancion_async('secuencias/Animacion5.xsq')
    .then(renderizarCancion_async('secuencias/Animacion6.xsq')
    .then(renderizarCancion_async('secuencias/Animacion7.xsq')
    .then(renderizarCancion_async('secuencias/Animacion8.xsq')
    .then(renderizarCancion_async('secuencias/Animacion9.xsq')
    .then(renderizarCancion_async('secuencias/Animacion10.xsq')
    .then(renderizarCancion_async('secuencias/Animacion11.xsq')
    .then(renderizarCancion_async('secuencias/Campanadas.xsq')
    .then(renderizarCancion_async('secuencias/Cant stop the feeling.xsq')
    .then(renderizarCancion_async('secuencias/Christmas Tecno Mix.xsq')
    .then(renderizarCancion_async('secuencias/Crystalize - Christmas on Runway.xsq')
    .then(renderizarCancion_async('secuencias/Cuento de navidad.xsq')
    .then(renderizarCancion_async('secuencias/Cumpleaños Feliz.xsq')
    .then(renderizarCancion_async('secuencias/dedicatoria1.xsq')
    .then(renderizarCancion_async('secuencias/dedicatoria2.xsq')
    .then(renderizarCancion_async('secuencias/dedicatoria3.xsq')
    .then(renderizarCancion_async('secuencias/El Tamborilero - Rafael.xsq')
    .then(renderizarCancion_async('secuencias/Frosty the Snowman.xsq')
    .then(renderizarCancion_async('secuencias/Happy Christmas.xsq')
    .then(renderizarCancion_async('secuencias/Here Comes Santa Claus.xsq')
    .then(renderizarCancion_async('secuencias/Inicio Show.xsq')
    .then(renderizarCancion_async('secuencias/Let It Snow.xsq')
    .then(renderizarCancion_async('secuencias/Los peces en el rio.xsq')
    .then(renderizarCancion_async('secuencias/marruecos.xsq')
    .then(renderizarCancion_async('secuencias/Michael Jackson Mix.xsq')
    .then(renderizarCancion_async('secuencias/Noche de paz.xsq')
    .then(renderizarCancion_async('secuencias/Blanca Navidad - La Oreja de Van Gogh.xsq')
    .then(renderizarCancion_async('secuencias/Pentatonix Carol of the bells.xsq')
    .then(renderizarCancion_async('secuencias/Phineas and Ferb - Winter Vacation.xsq')
    .then(renderizarCancion_async('secuencias/Ping Pong Christmas.xsq')
    .then(renderizarCancion_async('secuencias/Show830.xsq')
    .then(renderizarCancion_async('secuencias/Star Wars.xsq')
    ))))))))))))))))))))))))))))))))))))
    */


    return res.status(500).json({ response: 'Renderizando' })
})

app.get('/comentarios', (req, res) => {
    let comentarios = fs.readFileSync(FILE_COMENTARIOS, {encoding: 'utf-8'})
    comentarios = comentarios.split(SEPARADOR)
    let comentariosValidados = []
    comentarios.forEach(c => {
        let err = false
        try {
            c = JSON.parse(c)
            console.log(c)
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
    console.log(comentariosValidados)
    res.json({comentarios: comentariosValidados})
})

app.post('/comentarios', (req, res) => {
    console.log(req.body)
    let request = req.body
    request.date = new Date()
    fs.appendFileSync(FILE_COMENTARIOS, JSON.stringify(request) + SEPARADOR)
    res.redirect('http://micasasevedelejos.tudelanicos.com:31500/xScheduleWeb/comentarios.html')
})



app.listen(port, () => {
    axios.get(URL_GET_PLAYLIST_STEPS)
        .then(res => this.canciones = res.data.steps.map(step => step.name))
        .catch(err => console.log(err))
    console.log(`Marin Falcon app listening on http://micasasevedelejos.tudelanicos.com:${port}`)
    console.log('Página de canciones: http://micasasevedelejos.tudelanicos.com:31500/xScheduleWeb/index.html')
    console.log('Página de comentarios: http://micasasevedelejos.tudelanicos.com:31500/xScheduleWeb/comentarios.html')
    startBackground()

})

Cola = []

// Temporizador para poner ANIMACIONES
function startBackground() {
    setTimeout(startBackground, 15000, 'funky');
    if (this.sonando != 'PUEDES ELEGIR LA PRÓXIMA CANCIÓN' && this.sonando != '') {
        // Pongo las animaciones
        action = URL_SET_BACKGROUND(PLAYLIST_ANIMACIONES)
        axios.post(action)
            .then(console.log('Animación puesta'))
            .catch(e => console.log('No se han podido parar las animaciones: ' + e ))
    }
    // // Consulto las canciones en cola
    // axios.get(URL_GET_QUEUED_STEPS)
    //     .then(resData => {
    //         Cola = resData.data.steps.map(step => step.name)
    //         // Si no hay ninguna
    //         if (Cola.length == 0) {
    //             // Pongo las animaciones
    //             action = URL_SET_BACKGROUND(PLAYLIST_ANIMACIONES)
    //             axios.post(action)
    //                 .then(() => { })
    //                 .catch(e => res.status(500).json({ response: 'No se han podido parar las animaciones: ' + e }))
    //         }
    //     })
    //     .catch(err => { })


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
                                .then(console.log('Cerrada') )
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





