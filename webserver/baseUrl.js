const ENVS = { LOCAL: '127.0.0.1', PRO: '192.168.1.99' }
const DEFAULT_PORT = '31500'

const ACTUAL_ENV = ENVS.PRO

const BASE_URL = (port) => {
    if (ACTUAL_ENV !== ENVS.LOCAL && !port) {
        port = DEFAULT_PORT
    }

    return !port ? ACTUAL_ENV : `${ACTUAL_ENV}:${port}`
}

module.exports = BASE_URL