const URL_CANCIONES = 'http://micasasevedelejos.tudelanicos.com:3000/canciones',
    SONGS_CONT = document.getElementById('canciones'),
    QUEUE_CONT = document.getElementById('cola')

/* ******************************
    * DIV CANCIÓN SONANDO: '<div class="card p-2 m-2">' + name + '</div>'
    * DIV CANCIÓN SELECCIONABLE: '<div class="card p-2 m-2 seleccionable" onCLick="onSeleccionable(this)">' + name + '</div>'
****************************** */

const appendSongToDiv = (songName, isInQueue) => {
    let songDiv = document.createElement('div')
    songDiv.className = 'card p-2 m-2 '
    songDiv.innerHTML = songName
    // return alert(songName)
    songDiv.id = 'ID_' + songName

    let existe = ""
    try {
        existe = document.getElementById('ID_' + songName).id
    } catch { }

    if (existe == "") {
        if (!isInQueue) {
            songDiv.className += 'seleccionable'
            songDiv.setAttribute('onclick', 'onSeleccionable(this)')
            SONGS_CONT.append(songDiv)
        } else {
            songDiv.className += 'cola'
            QUEUE_CONT.append(songDiv)
        }
    }
}

const onSeleccionable = selecionable => {
    fetch(URL_CANCIONES)
        .then(response => response.json()
            .then(data => {
                if (data.cancionesCola.length >= 4)
                    return alert("Muchas canciones en cola, espera a que acabe una y podrás seleccionar la tuya ;)")

                let ahora = new Date()
                if (ahora.getHours() < 18 || (ahora.getHours() == 18 && ahora.getMinutes() < 30) || (ahora.getHours() == 21 && ahora.getMinutes() > 30) || ahora.getHours() >= 22) {
                    alert("Solo se puede seleccionar canciones de 18:30 a 21:30, ¡Vente entre esas horas y disfruta del espectáculo! ;)")
                    return
                }

                var dedicatoria = prompt('¡¡Es tu oportunidad!! \nPuedes escribir una dedicatoria para que suene antes de la canción (Si eres vergonzoso, no te preocupes deja el campo en blanco y no sonará nada ;)')

                // Añadimos la canción a la cola
                fetch(URL_CANCIONES, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify({ cancion: selecionable.textContent, dedicatoria: dedicatoria })
                })
                    .then(() => selecionable.remove())
                    .catch(err => console.log(err))
            })
        )
}

var i = 0

const getPlayList = () => {
    let divsSongsQueue = Array.from(QUEUE_CONT.getElementsByTagName('div')),
        divsSongsWaiting = Array.from(SONGS_CONT.getElementsByTagName('div')),
        songsQueue = divsSongsQueue.map(div => div.innerHTML),
        songsWaiting = divsSongsWaiting.map(div => div.innerHTML)


    fetch(URL_CANCIONES)
        .then(response => response.json())
        .then(data => {
            let cancionesCola = data.cancionesCola,
                cancionesSinReproducir = data.cancionesSinReproducir

            //Añadimos canciones a la cola
            cancionesCola
                .filter(cancion => !songsQueue.includes(cancion))
                .forEach(cancion => appendSongToDiv(cancion, true))

            //Eliminamos canciones de la cola
            divsSongsQueue
                .filter(cancion => !cancionesCola.includes(cancion.innerHTML))
                .forEach(cancion => cancion.remove())

            //Añadimos canciones a las canciones sin reproducir
            cancionesSinReproducir
                .filter(cancion => !songsWaiting.includes(cancion))
                .forEach(cancion => appendSongToDiv(cancion, false))

            //Eliminamos canciones de las canciones sin reproducir
            divsSongsWaiting
                .filter(cancion => !cancionesSinReproducir.includes(cancion.innerHTML))
                .forEach(cancion => cancion.remove())
        })
        .catch(error => {
            // alert("Esta habiendo errores con las canciones, disculpe las molestias. Prueba entre las 18:30 y 21:30'(")
            console.log(error)
        })
    console.log(i++)
}

getPlayList()
setInterval(getPlayList, 1000)
