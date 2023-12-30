const simonDisponible = true // Si esta a true funciona la pagina normal, sino se pone que no esta disponible

const $botones = Array.from(document.getElementsByTagName('button'))
const $msg = document.getElementById('msg')
const URL_SIMON_GET = (jugador, nuevaPartida) => `http://${BASE_URL('3000')}/simon?jugador=${jugador}&nuevaPartida=${nuevaPartida}`
const URL_SIMON_POST = `http://${BASE_URL('3000')}/simon`

const SIMON_DATA = {}
SIMON_DATA.estadoEnCola = ''
SIMON_DATA.longitudSecuencia = 1
SIMON_DATA.numeroSecuenciaActual = 1
SIMON_DATA.start = true

if (!simonDisponible) {
    alert("Lo sentimos, el minijuego del Simon Dice no esta disponible en este momento")
    location.href = 'index.html'; // redireccionamos a la pagina principal
}
else {
    SIMON_DATA.jugador = prompt('Bienvenido al Simon Dice, por favor, introduce tu nombre:')
    if (!SIMON_DATA.jugador || SIMON_DATA.jugador.trim() === '') 
      { location.href = 'index.html'; } 
    else  {
        desactivarBotones()

        getSimon(true)
            .then(data => { // Iniciamos la partida y comprobamos si tiene el mismo nombre que otro jugador
                if (data.error) {
                    alert(data.error)
                    location.href = 'index.html'; // redireccionamos a la pagina principal
                }
            })
            .catch(e =>console.log(e))

        // Intervalo para sepamos si el usuario esta activo o no y su estado en la cola
        setInterval(async () => {
            var { status } = await getSimon(false)
            SIMON_DATA.estadoEnCola = status

            if (status === 'quit') {
                location.href = 'index.html'
                return
            }

            if (SIMON_DATA.estadoEnCola === 'running') {
                $msg.setAttribute("style", "display: none;")
            }

            if (SIMON_DATA.start && SIMON_DATA.estadoEnCola === 'running') {
                activarBotones()
                postSimon('start', '')
                SIMON_DATA.start  = false
            }
        }, 1000)
    }
}

async function getSimon(nuevaPartida) {
    try {
        var res = await fetch(URL_SIMON_GET(SIMON_DATA.jugador, nuevaPartida))
        var data = await res.json()

        if (data.error) {
            console.error(data.error)
        }
        return data
    } catch (e) {
        console.log(e)
        return new Promise()
    }
}

function postSimon(accion, color) {
    var url = URL_SIMON_POST,
        params = {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                accion: accion,
                color: color,
                jugador: SIMON_DATA.jugador
            }),
            headers: { 'Content-Type': 'application/json' },
        }

    var request = new Request(url, params)

    fetch(request)
        .catch(err => console.log(err))
}

function activarBotones() {
    $botones.forEach(boton => {
        boton.removeAttribute("style")
    })
}

function desactivarBotones() {
    $botones.forEach(boton => {
        boton.setAttribute("style", "display: none;")
    })
}


function seleccionarColor(boton)  {
    postSimon('select',  boton.getAttribute("id"))
}