const simonDisponible = true // Si esta a true funciona la pagina normal, sino se pone que no esta disponible

const $botones = Array.from(document.getElementsByTagName('button'))
const URL_SIMON_GET = (jugador, nuevaPartida) => `http://${BASE_URL('3000')}/simon?jugador=${jugador}&nuevaPartida=${nuevaPartida}`

var estadoEnCola = ''

if (!simonDisponible) {
    alert("Lo sentimos, el minijuego del simon dice no esta disponible en este momento")
    location.href = 'index.html'; // redireccionamos a la pagina principal
}

var jugador = prompt('Bienvenido al simon dice, por favor, introduce tu nombre:')
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
    getSimon(false)
}, 5000)

async function getSimon(nuevaPartida) {
    var res = await fetch(URL_SIMON_GET(jugador, nuevaPartida))
    var data = await res.json()

    if (data.error) {
        console.error(data.error)
    }
    return data
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

