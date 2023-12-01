const fs = require('fs')
const {
    BASE_URL,
    PORT,
    PLAYLIST,
    QUERY,
    COMMAND,
    DEDICATIONS,
    COMENTS,
    SHOWS,
    SHOWS_OPTIONS,
    URL,
    SAVE_DIRECTORY
} = require('./config.json')

// Funciones para contruir los strings
const baseUrl = (base, port) => `${base}:${port}`

const xScheduleUrl = baseUrl(BASE_URL.XSCHEDULE, PORT.XSCHEDULE)
const webServerUrl = baseUrl(BASE_URL.WEBSERVER, PORT.WEBSERVER)
const xLigthsUrl = baseUrl(BASE_URL.XSCHEDULE, PORT.XLIGTHS)

const xScheduleQuery = (query, parameters = []) => xScheduleUrl + QUERY.BASE + query + (parameters.length > 0 ? '&Parameters=' + parameters.join(',') 			: '')
const xScheduleCommand = (command, parameters = []) => xScheduleUrl + COMMAND.XSCHEDULE.BASE + command + (parameters.length > 0 ? '&Parameters=' + parameters.join(',') 			: '')
const xLightsCommand = (command, seq) => xLigthsUrl + COMMAND.XLIGTHS.BASE + command + (seq !== undefined ? seq 			: '')
const showsFormated = []
SHOWS.forEach(show => showsFormated.push(SHOWS_OPTIONS.PATH + show + SHOWS_OPTIONS.EXTENSION))

// Propiedades que va a tener el objeto cuando se le haga el require
let data = {
    //xScheduleQuery
    GET_QUEUED_STEPS		: xScheduleQuery(QUERY.GET_QUEUED_STEPS),
    GET_PLAYING_STATUS		: xScheduleQuery(QUERY.GET_PLAYING_STATUS),
    GET_PLAYLIST_STEPS		: xScheduleQuery(QUERY.GET_PLAYLIST_STEPS, [PLAYLIST.SONGS]),
    //xScheduleCommand
    CLEAR_BACKGROUND		: xScheduleCommand(COMMAND.XSCHEDULE.CLEAR_BACKGROUND, [PLAYLIST.ANIMATIONS]),
    ENQUEUE_SONG			: (songName, playlist) => xScheduleCommand(COMMAND.XSCHEDULE.ENQUEUE_SONG, [playlist, songName]),
    SET_BACKGROUND			: xScheduleCommand(COMMAND.XSCHEDULE.SET_BACKGROUND),
    SET_VOLUME			    : volume => xScheduleCommand(COMMAND.XSCHEDULE.SET_VOLUME, [volume]),
    STOP_ANIMATIONS			: xScheduleCommand(COMMAND.XSCHEDULE.STOP_ANIMATIONS),
    //xLightsCommand
    OPEN_SEQUENCE			: (seq) => xLightsCommand(COMMAND.XLIGTHS.OPEN_SEQUENCE, seq),
    RENDER_ALL			    : xLightsCommand(COMMAND.XLIGTHS.RENDER_ALL),
    SAVE_SEQUENCE			: xLightsCommand(COMMAND.XLIGTHS.SAVE_SEQUENCE),
    CLOSE_SEQUENCE			: xLightsCommand(COMMAND.XLIGTHS.CLOSE_SEQUENCE),
    //DEDICATIONS
    MAX_DEDICATIONS         : parseInt(DEDICATIONS.MAX),
    SAVE_DIRECTORY          : SAVE_DIRECTORY,
    //Coments   
    COMENTS_PATH            : SAVE_DIRECTORY + COMENTS.FILE_PATH,
    COMENTS_SEPARATOR       : COMENTS.SEPARATOR,
    //Playlists
    PLAYLIST                : PLAYLIST,
    //Url
    URL_CHOOSE_SONG         : xScheduleUrl + URL.XSCHEDULE.CHOOSE_SONG,
    URL_COMENTS             : xScheduleUrl + URL.XSCHEDULE.COMENTS,
    URL_WEBSERVER           : webServerUrl,
    //webServer
    WEBSERVER_SONGS         : URL.WEBSERVER.SONGS,
    WEBSERVER_COMENTS       : URL.WEBSERVER.COMENTS,
    GET_SONGS               : webServerUrl + URL.WEBSERVER.SONGS,
    GET_COMENTS             : webServerUrl + URL.WEBSERVER.COMENTS,
    //Shows
    SHOWS                   : showsFormated,
    //webServerPort         
    WEBSERVER_PORT          : PORT.WEBSERVER
}

module.exports = data
// Generamos un JSON, que va a ser más legible, para poder coger el JSON desde los js de los html
fs.writeFileSync(__dirname + '/procesedData.json', JSON.stringify(data, undefined, 1))