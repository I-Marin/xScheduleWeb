var URL_COMENTS, URL_WEBSERVER

// TODO leer el procesedData.json y asignar las urls
/*
var parts = [
    new Blob(['you construct a file...'], {type: 'text/plain'}),
    ' Same way as you do with blob',
    new Uint16Array([33])
];
var file = new File(parts, 'config/procesedData.json', {
    type: "overide/mimetype" 
});

var fr = new FileReader()
fr.onload = function(e) {
  var data = JSON.parse(e.target.result)
    URL_COMENTS = data.URL_COMENTS
    URL_WEBSERVER = data.URL_WEBSERVER
};
fr.readAsText(file)
*/
document.getElementById('volver').setAttribute('href', URL_COMENTS)
document.getElementById('formComentarios').setAttribute('action', URL_WEBSERVER + '/comentarios')

fetch(URL_WEBSERVER + '/comentarios')
.then(res => res.json())
.then(res => 
  res.comentarios.reverse().forEach(comentarioJSON => {
    let divContainer = document.createElement('div')
    document.getElementById('comentarios').append(divContainer)
    console.log(divContainer)

    divContainer.className = 'comentario card p-2 m-2'

    let comentario    = document.createElement('p'),
      nombre          = document.createElement('p'),
      valoracionCont  = document.createElement('p')

    comentario.innerHTML = '<b>Comentario:</b><br>' + comentarioJSON.comentario.replace(/\n/g,'<br>')

    nombre.innerHTML = '-' + comentarioJSON.nombre
    nombre.className = 'nombre'

    valoracionCont.innerHTML = '<b>Valoración: </b><span>'
    valoracionCont.className = 'estrellas'
    let estrellas = document.createElement('span')
    for(let i = 0; i < parseInt(comentarioJSON.estrellas); i++) 
      estrellas.innerHTML += '★'
    valoracionCont.append(estrellas)
        
    divContainer.append(valoracionCont)     
    divContainer.append(comentario)
    divContainer.append(nombre)   
    })
)
.catch(err => {
  alert('No se han podido cargar los comentarios, disculpe las molestias :\'(')
  console.log(err)
})