import { URL_CHOOSE_SONG, URL_COMENTS, GET_COMENTS, GET_SONGS } from './data'

// Buscamos todos los elementos que contengan el atributo url
var nodesSnapshot = document.evaluate('//*[@url]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
var elementsWithUrl = []
for ( var i=0 ; i < nodesSnapshot.snapshotLength; i++ )
  elementsWithUrl.push( nodesSnapshot.snapshotItem(i) )

var urls = { URL_CHOOSE_SONG, URL_COMENTS, GET_COMENTS, GET_SONGS }
// Navegamos por esos elementos que contienen el atributo url y les cambiamos el valor a la propiedad que necesitemos según la etiqueta que sea (ej: en la etiqueta form la url va en el action)
elementsWithUrl.forEach(element => {
  var prop = element.getAttribute('url')
  switch(element.nodeName){
    case 'FORM': 
      element.setAttribute('action', urls[prop]) 
      break
    case 'A':
      element.setAttribute('href', urls[prop])
      break
    case 'DIV':
      element.setAttribute('onClick', 'localtion.href=\'' + urls[prop] + '\'')
      break
  }
})