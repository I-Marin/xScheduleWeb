const ENVS = { LOCAL: '127.0.0.1', PRO: 'micasasevedelejos.tudelanicos.com' }
const DEFAULT_PORT = '31500'

const ACTUAL_ENV = ENVS.PRO

const BASE_URL = (port) => {
    if (ACTUAL_ENV !== ENVS.LOCAL && !port) {
        port = DEFAULT_PORT
    }

    return !port ? ACTUAL_ENV : `${ACTUAL_ENV}:${port}`
}