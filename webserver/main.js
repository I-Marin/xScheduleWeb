const express = require('express')
const app = express()
const cors = require('cors')
const axios = require('axios')
const gTTS = require('gtts')
const fs = require('fs')

// Cogemos el data
const {
    //xScheduleQuery
    GET_QUEUED_STEPS, GET_PLAYING_STATUS, GET_PLAYLIST_STEPS, 
    //xScheduleCommand
    CLEAR_BACKGROUND, ENQUEUE_SONG, SET_BACKGROUND, SET_VOLUME, STOP_ANIMATIONS,
    //xLightsCommand
    OPEN_SEQUENCE, RENDER_ALL, SAVE_SEQUENCE, CLOSE_SEQUENCE,
    //DEDICATIONS
    MAX_DEDICATIONS, SAVE_DIRECTORY,
    //Coments
    COMENTS_PATH, COMENTS_SEPARATOR,
    //Plalists
    PLAYLIST,
    //Showas
    SHOWS,
    //Urls
    URL_CHOOSE_SONG, URL_COMENTS, URL_WEBSERVER, WEBSERVER_PORT,
    // WEBSERVER
    WEBSERVER_SONGS, WEBSERVER_COMENTS
} = require('../config/data')
// Cogemos las funciones del utils
const {
    startBackground,
    encolarCancion,
    renderSongsFromArray
} = require('./utils')

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



app.get(WEBSERVER_SONGS, (req, res) => {
    axios.get(GET_QUEUED_STEPS)
    .then(resData => {
        axios.get(GET_PLAYING_STATUS)
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
        .catch(err =>  console.log(err))
    })
    .catch(err => console.log(err))
})

app.post(WEBSERVER_SONGS, (req, res) => {
    let body = req.body
    let cancion = body.cancion

    if (!this.canciones.includes(cancion))
        return res.status(500).json({ response: 'La canción no se encuentra en la playlist' })

    this.cancionesEnProceso.push(cancion)

    let dedicatoria = body.dedicatoria != '' ? body.dedicatoria : undefined,
        fileName
    
    // Guardo el historico de canciones
    txt = SAVE_DIRECTORY + 'canciones.txt'
    let now = new Date();
    fs.appendFileSync(txt, now + ' ' + cancion + '\n')

    if (dedicatoria) {
        if (this.i >= MAX_DEDICATIONS)
            this.i = 0

        fileName = `dedicatoria${++this.i}`
        let seq = 'secuencias/' + fileName + '.xsq'
        let mp3 = SAVE_DIRECTORY + fileName + '.mp3'
        let txt = SAVE_DIRECTORY + fileName + '.txt'
        console.log('DEDICATORIA: ' + dedicatoria + '\nARCHIVO: ' + fileName + '\n')
        new gTTS(dedicatoria, 'es')
            .save(mp3, (err, result) => {
                if (err)
                    return console.log(err)
                fs.writeFileSync(txt, dedicatoria.toUpperCase())
                // Guardo el historico de dedicatorias
                txt = SAVE_DIRECTORY + 'dedicatorias.txt'
                let now = new Date();
                fs.appendFileSync(txt, now + ' ' + dedicatoria + '\n')


                // Abro la secuencia
                err = ''
                let action1 = OPEN_SEQUENCE(seq)
                axios.get(action1)
                .then(() => {
                    // Renderizo
                    let action2 = RENDER_ALL
                    axios.get(action2)
                    .then(() => {
                        // Guardo la secuencia
                        let action3 = SAVE_SEQUENCE
                        axios.get(action3)
                        .then(() => {
                            let action4 = CLOSE_SEQUENCE
                            axios.get(action4)
                            .then(() => {
                                let action5 = ENQUEUE_SONG(fileName, PLAYLIST.SONGS)
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

            }); 

    } else { // No hay dedicatoria
        this.cancionesEnProceso = this.cancionesEnProceso.filter(c => c != cancion)
        encolarCancion(cancion)
    }

})

app.get('/renderall', (req, res) => {
    renderSongsFromArray(SHOWS)
    return res.status(200).json({ response: 'Renderizando' })
})

app.get(WEBSERVER_COMENTS, (req, res) => {
    let comentarios = fs.readFileSync(COMENTS_PATH, {encoding: 'utf-8'})
    comentarios = comentarios.split(COMENTS_SEPARATOR)
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

app.post(WEBSERVER_COMENTS, (req, res) => {
    console.log(req.body)
    let request = req.body
    request.date = new Date()
    fs.appendFileSync(COMENTS_PATH, JSON.stringify(request) + COMENTS_SEPARATOR)
    res.redirect(URL_)
})



app.listen(WEBSERVER_PORT, () => {
    axios.get(GET_PLAYLIST_STEPS)
        .then(res => this.canciones = res.data.steps.map(step => step.name))
        .catch(err => console.log(err))
    console.log('Marin Falcon app listening on ' + URL_WEBSERVER)
    console.log('Página de canciones: ' + URL_CHOOSE_SONG)
    console.log('Página de comentarios: ' + URL_COMENTS)

    startBackground()
})
