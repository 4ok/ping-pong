import App from '~/components/App/App'

import './index.css'

const app = new App()

document.addEventListener('DOMContentLoaded', app.emit.bind(app, 'domLoaded'))
