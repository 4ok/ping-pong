import { autobind } from 'core-decorators'
import Slider from 'bootstrap-slider'

import Component from '~/libs/Component'

import './Settings.css'

const buttonsTexts = {
	start: 'Start',
	pause: 'Pause',
	continue: 'Countinue',
	create: 'Preview',
	new: 'New',
}

const slidersOptions = {
	numBalls: {
		title: 'Number of balls',
		id: 'Settings__num-balls',
		params: { step: 2 },

	},
	ballSizes: {
		title: 'Balls sizes: min and initial',
		id: 'Settings__ball-sizes',
		params: { step: 1 },
	},
	ballSpeeds: {
		title: 'Balls speeds: min and max',
		id: 'Settings__ball-speeds',
		params: { step: 0.1 },
	},
}

const getSliderHtml = ({ title, id }) => `
	<div class="Settings__row">
		<h2 class="Settings__title">${ title }</h2>
			<div class="Settings__slider">
				<input
					type="text"
					id="${ id }"
					class="hidden"
				/>
			</div>
		</h2>
	</div>
`

export default @autobind class Settings extends Component {

	constructor({
		container, ballsRect, minStep, maxStep,
	}) {
		super()

		Object.assign(this, {
			_container: container,
			_ballsRect: ballsRect,
			_minStep: minStep,
			_maxStep: maxStep,
		})

		this._createSliders()
		this._initSliders()
		this._initButtons()

		this.on('resize', this._onResize)
		this.on('win', this._onWin)
	}

	_onResize({ ballsRect }) {
		this._ballsRect = ballsRect

		this._applySlidersAction('destroy')
		this._initSliders()

		if (this._created && !this._started) {
			this._onClickCreateButton()
		}
	}

	_onWin() {
		const { _startButton: startButton } = this

		this._created = false
		this._started = false

		startButton.textContent = buttonsTexts.start
	}

	_applySlidersAction(action) {
		const { _sliders: sliders } = this

		Object
			.keys(sliders)
			.forEach(key => sliders[key][action]())
	}

	_createSliders() {
		const { _container: container } = this

		const html = Object
			.keys(slidersOptions)
			.reduce((result, key) => result + getSliderHtml(slidersOptions[key]), '')

		container
			.querySelector('.Settings__sliders')
			.insertAdjacentHTML('afterBegin', html)
	}

	_initSliders() {
		const {
			_ballsRect: ballsRect,
			_minStep: minStep,
			_maxStep: maxStep,
		} = this

		const step = minStep + Math.round((maxStep - minStep) / 2)

		const minContainerSize = Math.min(ballsRect.width, ballsRect.height)
		const maxSize = Math.round(minContainerSize / 4)
		const minSize = Math.ceil(step * 2)
		const ballSize = maxSize - Math.round((maxSize - minSize) / 2)

		const minBalls = 3
		const maxBalls = this._getMaxBalls({ ballSize })
		const numBalls = this._getNumBalls({
			minBalls,
			maxBalls,
		})

		const sliderParams = {
			numBalls: {
				min: minBalls,
				max: maxBalls,
				value: numBalls,
			},
			ballSizes: {
				min: minSize,
				max: maxSize,
				value: [ minSize, ballSize ],
			},
			ballSpeeds: {
				min: minStep,
				max: maxStep,
				value: [ minStep, step ],
			},
		}

		this._sliders = Object
			.keys(sliderParams)
			.reduce((result, key) => {
				const sliderOptions = slidersOptions[key]

				result[key] = new Slider(`#${ sliderOptions.id }`, {
					...sliderOptions.params,
					...sliderParams[key],
				})

				return result
			}, {})

		const { ballSizes } = this._sliders

		ballSizes.on('change', this._onChangeBallSizes)
	}

	_onChangeBallSizes(data) {
		const { oldValue, newValue } = data

		if (String(newValue) === String(oldValue)) {
			return
		}

		const { numBalls } = this._sliders
		const ballSize = newValue[1]
		const maxBalls = this._getMaxBalls({ ballSize })

		if (numBalls.getValue() > maxBalls) {
			numBalls.setValue(maxBalls)
		}

		numBalls.setAttribute('max', maxBalls)
	}

	_getMaxBalls({ ballSize }) {
		const { _ballsRect: ballsRect } = this

		const doubleSize = ballSize * 2
		const maxXBalls = Math.floor(ballsRect.width / doubleSize)
		const maxYBalls = Math.floor(ballsRect.height / doubleSize)

		let result = maxXBalls * maxYBalls

		if (result % 2 === 0) {
			result += 1
		}

		return result
	}

	_getNumBalls({ minBalls, maxBalls }) {
		let result = Math.ceil((minBalls + (maxBalls - minBalls) / 3))

		if (result % 2 === 0) {
			result += 1
		}

		return result
	}

	_initButtons() {
		const createButton = document.body.querySelector('.Settings__create-button')
		const startButton = document.body.querySelector('.Settings__start-button')

		createButton.addEventListener('click', this._onClickCreateButton)
		startButton.addEventListener('click', this._onClickStart)

		Object.assign(this, {
			_createButton: createButton,
			_startButton: startButton,
		})
	}

	_onClickCreateButton() {
		const {
			_sliders: sliders,
			_startButton: startButton,
			_createButton: createButton,
		} = this

		const data = Object
			.keys(sliders)
			.reduce((result, name) => {
				result[name] = sliders[name].getValue()

				return result
			}, {})

		startButton.textContent = buttonsTexts.start
		createButton.textContent = buttonsTexts.create

		this._started = false
		this._created = true

		this._applySlidersAction('enable')

		this.emit('create', data)
	}

	_onClickStart() {
		const {
			_startButton: startButton,
			_createButton: createButton,
		} = this

		if (!this._created) {
			this._onClickCreateButton()
		}

		createButton.textContent = buttonsTexts.new
		startButton.textContent = this._started
			? buttonsTexts.continue
			: buttonsTexts.pause


		this.emit(this._started ? 'pause' : 'start')

		this._started = !this._started
	}
}
