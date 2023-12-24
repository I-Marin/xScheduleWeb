const simonDisponible = true // Si esta a true funciona la pagina normal, sino se pone que no esta disponible

const $botones = Array.from(document.getElementsByTagName('button'))
const URL_SIMON_GET = (jugador, nuevaPartida) => `http://${BASE_URL('3000')}/simon?jugador=${jugador}&nuevaPartida=${nuevaPartida}`
const URL_SIMON_POST = `http://${BASE_URL('3000')}/simon}`

var estadoEnCola = ''
var longitudSecuencia = 1
var numeroSecuenciaActual = 1
var start = true

if (!simonDisponible) {
    alert("Lo sentimos, el minijuego del Simon Dice no esta disponible en este momento")
    location.href = 'index.html'; // redireccionamos a la pagina principal
}

var jugador = prompt('Bienvenido al Simon Dice, por favor, introduce tu nombre:')
desactivarBotones()

getSimon(true)
    .then(data => { // Iniciamos la partida y comprobamos si tiene el mismo nombre que otro jugador
        if (data.error) {
            alert(data.error)
            location.href = 'index.html'; // redireccionamos a la pagina principal
        }
    })

// Intervalo para sepamos si el usuario esta activo o no y su estado en la cola
setInterval(async () => {
    var { status } = getSimon(false)
    estadoEnCola = status

    if (start && estadoEnCola === 'running') {
        activarBotones()
        postSimon('start', '')
    }
}, 3000)

async function getSimon(nuevaPartida) {
    var res = await fetch(URL_SIMON_GET(jugador, nuevaPartida))
    var data = await res.json()

    if (data.error) {
        console.error(data.error)
    }
    return data
}

function postSimon(accion, color) {
    var url = URL_SIMON_POST,
        params = {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                accion: accion,
                cancion: color
            }),
            headers: { 'Content-Type': 'application/json' },
        }

    var request = new Request(url, params)

    fetch(request)
        .catch(err => console.log(err))
}

function activarBotones() {
    $botones.forEach(boton => {
        boton.removeAttribute("disabled")
    })
}

function desactivarBotones() {
    $botones.forEach(boton => {
        boton.setAttribute("disabled", "disabled")
    })
}

