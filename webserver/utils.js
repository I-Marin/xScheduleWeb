const axios = require('axios')
const {
    //xScheduleCommand
    ENQUEUE_SONG, SET_BACKGROUND,
    //xLightsCommand
    OPEN_SEQUENCE, RENDER_ALL, SAVE_SEQUENCE, CLOSE_SEQUENCE
} = require('../config/data')

// Temporizador para poner ANIMACIONES
const startBackground = () => {
    setTimeout(startBackground, 15000, 'funky');
    if (this.sonando != 'PUEDES ELEGIR LA PRÓXIMA CANCIÓN' && this.sonando != '') {
        // Pongo las animaciones
        action = SET_BACKGROUND
        axios.post(action)
            .then(console.log('Animación puesta'))
            .catch(e => console.log('No se han podido parar las animaciones: ' + e ))
    }
}

const renderizarCancion = cancion => {
    let action = XLIGTHS_COMMAND('' + cancion)
    console.log(action)
    axios.get(action)
        .then(() => {
            // Renderizo
            action = XLIGTHS_COMMAND('renderAll')
            console.log(action)
            axios.get(action)
                .then(() => {
                    // Guardo la secuencia
                    action = XLIGTHS_COMMAND('saveSequence')
                    console.log(action)
                    axios.get(action)
                        .then(() => {
                            action = XLIGTHS_COMMAND('closeSequence')
                            return axios.get(action)
                                .then(console.log('Cerrada') )
                                .catch(e => {
                                    console.log('Error ' + action + ':\n ' + e + '\n\n')
                                })
                        })
                        .catch(e => {
                            console.log('Error ' + action + ':\n ' + e + '\n\n')
                        })
                })
                .catch(e => {
                    console.log('Error ' + action + ':\n ' + e + '\n\n')
                })
        })
        .catch(e => {
            console.log('Error ' + action + ':\n ' + e + '\n\n')
        })
}

const renderizarCancion_async = async cancion => {
    let action = OPEN_SEQUENCE(cancion)
    console.log(action)
    await axios.get(action)

    action = RENDER_ALL
    console.log(action + ' ' + cancion)
    await axios.get(action)

    action = SAVE_SEQUENCE
    console.log(action + ' ' + cancion)
    await axios.get(action)

    action = CLOSE_SEQUENCE
    console.log(action + ' ' + cancion)
    await axios.get(action)
}

const encolarCancion = cancion => {
    try {
        // this.cancionesEnProceso = [] //this.cancionesEnProceso.filter(c => c != cancion)
    
        let action1 = ENQUEUE_SONG(cancion, PLAYLIST_CANCIONES)
        axios.post(action1)
            .then(() => {
                console.log('Canción añadida a la cola: ' + cancion)
            })
            .catch(e => res.status(500).json({ response: 'No se ha podido añadir a la cola la canción: ' + e }))
        
        // // Paro el background
        // let action2 = CLEAR_BACKGROUND
        // axios.post(action2)
        //     .then(() => console.log('Parado el background: ' + action2))
        //     .catch(e => res.status(500).json({ response: 'No se han podido parar las animaciones: ' + e }))
        
        
        // let action3 = SET_VOLUME(50)
        // axios.post(action3)
        //     .then(() => console.log('Volumen al 50: ' + action3))
        //     .catch(e => res.status(500).json({ response: 'No se ha podido modificar volumen: ' + e }))
    } catch (error) {
        console.log('Error encolando cancion : ' + error);
    }

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


module.exports = {
    startBackground: startBackground,
    renderSongsFromArray: renderSongsFromArray,
    encolarCancion: encolarCancion
}