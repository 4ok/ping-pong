import './Welcome.css'

export default class Welcome {

	constructor() {
		this._elem = document.querySelector('.Welcome')
	}

	hide() {
		const { classList } = this._elem

		classList.add('hidden')
	}

	show() {
		const { classList } = this._elem

		classList.remove('hidden')
	}
}
