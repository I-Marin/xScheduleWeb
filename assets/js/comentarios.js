readDataJSON()
.then(data => {
  var GET_COMENTS = data.GET_COMENTS

  fetch(GET_COMENTS)
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
})