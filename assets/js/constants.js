const BASE_URL = require("../../webserver/baseUrl.js")

module.exports = {
    URL_CANCIONES: `http://${BASE_URL}:3000/canciones`,
    URL_TEST_MODE_ON: `http://${BASE_URL}:3000/test_mode_on`,
    URL_TEST_MODE_OFF: `http://${BASE_URL}:3000/test_mode_off`,
    URL_STOP_ALL: `http://${BASE_URL}:3000/stop_all`,
    URL_SIGUIENTE: `http://${BASE_URL}:3000/siguiente`,
    URL_VOLUMEN: volumen => `http://${BASE_URL}:3000/set_volume_to?volumen=${volumen}`,
}