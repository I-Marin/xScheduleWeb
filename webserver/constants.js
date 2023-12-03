const BASE_URL = require("./baseUrl.js")

const constants = {
    PLAYLIST_CANCIONES: `CANCIONES`,
    PLAYLIST_ANIMACIONES: `ANIMATIONS`,
    URL_GET_QUEUED_STEPS: `http://${BASE_URL()}/xScheduleQuery?Query=GetQueuedSteps`,
    URL_GET_PLAYING_STATUS: `http://${BASE_URL()}/xScheduleQuery?Query=GetPlayingStatus`,
    URL_CLEAR_BACKGROUND: `http://${BASE_URL()}/xScheduleCommand?Command=Clear background playlist`,
    URL_SET_BACKGROUND: playlist => `http://${BASE_URL()}/xScheduleCommand?Command=Set playlist as background&Parameters=${playlist}`,
    URL_ENQUEUE_SONG: (songName, playlist) => `http://${BASE_URL()}/xScheduleCommand?Command=Enqueue playlist step&Parameters=${playlist},${songName}`,
    URL_STOP_ANIMATIONS: playlist => `http://${BASE_URL()}/xScheduleCommand?Command=Stop specified playlist&Parameters=${playlist}`,
    URL_XLIGTHS_COMMAND: command => `http://${BASE_URL("49913")}/${command}`,
    URL_SET_VOLUME: volumen => `http://${BASE_URL()}/xScheduleCommand?Command=Set volume to&Parameters=${volumen}`,
    URL_SET_TEST_MODE_ON: `http://${BASE_URL()}/xScheduleCommand?Command=Start test mode&Parameters=Test`,
    URL_SET_TEST_MODE_OFF: `http://${BASE_URL()}/xScheduleCommand?Command=Stop test mode`,
    URL_STOP_ALL: `http://${BASE_URL()}/xScheduleCommand?Command=Stop all now`,
    URL_SIGUIENTE: `http://${BASE_URL()}/xScheduleCommand?Command=Next step in current playlist`,
    FILE_COMENTARIOS: `C:/xLights/Show2022/secuencias/comentarios.txt`,
    SEPARADOR: `;\n`,
}
constants.URL_GET_PLAYLIST_STEPS = `http://${BASE_URL()}/xScheduleQuery?Query=GetPlayListSteps&Parameters=${constants.PLAYLIST_CANCIONES}`

module.exports = constants