
import { throttle } from 'lodash'
import { autobind } from 'core-decorators'

import Component from '~/libs/Component'

import Header from '~/components/Header/Header'
import Balls from '~/components/Balls/Balls'
import Welcome from '~/components/Welcome/Welcome'
import Settings from '~/components/Settings/Settings'
import Alert from '~/components/Alert/Alert'

import './App.css'

const MIN_STEP = 0.2
const RESIZE_THROTTLE_TIMEOUT = 1200
const SPEED_RATION = 1 / 200

const messages = { winner: ({ number }) => `Won the&nbsp;item at&nbsp;number&nbsp;${ number }.<br>Out&nbsp;congratulations!` }

export default @autobind class App extends Component {

	constructor() {
		super()

		this.on('domLoaded', this._onDomLoaded)
		window.addEventListener('resize', throttle(this._onResize, RESIZE_THROTTLE_TIMEOUT))
	}

	_onDomLoaded() {
		const contentElem = document.body.querySelector('.Content')
		const settingsElem = document.body.querySelector('.Settings')
		const ballsElem = document.body.querySelector('.Balls')

		const ballsRect = ballsElem.getBoundingClientRect()
		const avgBallsSize = (ballsRect.width + ballsRect.height) / 2
		let maxStep = Math.ceil(avgBallsSize * SPEED_RATION)

		if (maxStep < 1) {
			maxStep = 1
		}

		const settings = new Settings({
			container: settingsElem,
			ballsRect,
			minStep: MIN_STEP,
			maxStep,
		})

		Object.assign(this, {
			_contentElem: contentElem,
			_settingsElem: settingsElem,
			_ballsElem: ballsElem,
			_ballsRect: ballsRect,
			_maxStep: maxStep,
			_settings: settings,
			_header: new Header(),
			_welcome: new Welcome(),
		})

		settings.on('create', this._onCreate)
		settings.on('start', this._onStart)
		settings.on('pause', this._onPause)
	}

	_onResize() {
		this._ballsRect = this._ballsElem.getBoundingClientRect()

		this._settings.emit('resize', { ballsRect: this._ballsRect })

		if (this._balls) {
			this._balls.emit('resize', { containerRect: this._ballsRect })
		}
	}

	_onCreate(data) {
		const {
			_ballsElem: container,
			_ballsRect: containerRect,
			_welcome: welcome,
		} = this

		const {
			ballSizes: [ minSize, size ],
			ballSpeeds: [ minStep, maxStep ],
			numBalls: quantity,
		} = data

		welcome.hide()

		if (this._balls) {
			this._balls.remove()
		}

		if (this._alert) {
			this._alert.remove()
			this._alert = null
		}

		this._balls = new Balls({
			container,
			containerRect,
			quantity,
			minStep,
			maxStep,
			size,
			minSize,
		})

		this._balls.on('win', this._onWin)
	}

	_onStart() {
		this._balls.start()
	}

	_onPause() {
		this._balls.stop()
	}

	_onWin({ winnerItem }) {
		const { _contentElem: container } = this
		const { number } = winnerItem

		this._settings.emit('win')

		this._alert = new Alert({
			container,
			message: messages.winner({ number }),
		})
	}
}
