const simonDisponible = false // Si esta a true funciona la pagina normal, sino se pone que no esta disponible

if (!simonDisponible) {
    alert("Lo sentimos, el minijuego del simon dice no esta disponible en este momento")
    location.href = 'index.html'; // redireccionamos a la pagina principal
}

