import './Alert.css'

export default class Alert {

	constructor({ container, message, type = 'success' }) {
		const elem = document.createElement('div')

		elem.className = `Alert alert alert-${ type }`
		elem.innerHTML = message

		Object.assign(this, {
			_container: container,
			_elem: container.appendChild(elem),
		})
	}

	remove() {
		this._container.removeChild(this._elem)
	}
}
