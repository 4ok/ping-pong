
import { random } from 'lodash'
import { autobind } from 'core-decorators'

import Component from '~/libs/Component'
import units from '~/constants/units'

import './BallsItem.css'

const FONT_SIZE_RATIO = 0.4

const defaultProps = { className: 'BallsItem' }

export default @autobind class BallsItem extends Component {

	constructor({
		container,
		containerRect,
		coords,
		size,
		color,
		number,
		step,
		directions,
		rotateSpeed = 0,
	}) {
		super()

		Object.assign(this, {
			_container: container,
			_containerRect: containerRect,
			_coords: coords,
			_directions: directions || BallsItem.getRandomDirections(),
			_rotateSpeed: rotateSpeed,
			_rotateDirection: BallsItem.getRandomDirection(),
			_rotate: 0,
			_min: {
				x: 0,
				y: 0,
			},
		})

		const readOnlyProps = {
			size,
			color,
			number,
			step,
		}

		Object
			.keys(readOnlyProps)
			.forEach((key) => {
				Object.defineProperties(this, {
					[key]: {
						value: readOnlyProps[key],
						writable: false,
						configurable: false,
					},
				})
			})

		this.on('resize', this._onResize)
		this._display()
	}

	start() {
		this._animationId = requestAnimationFrame(this._move.bind(this, { newPosition: false }))
	}

	stop() {
		cancelAnimationFrame(this._animationId)
	}

	remove() {
		const {
			_container: container,
			_elem: elem,
		} = this

		this.stop()
		container.removeChild(elem)
	}

	get coords() {
		const {
			_coords: coords,
			size,
		} = this

		return units.reduce((result, { coordName }) => {
			result[`${ coordName }2`] = coords[coordName] + this._getCoordStep(coordName) + size

			return result
		}, coords)
	}

	get centerCoords() {
		const { coords, size } = this
		const halfSize = Math.round(size / 2)

		return units.reduce((result, { coordName }) => {
			result[coordName] = coords[coordName] + halfSize

			return result
		}, {})
	}

	get nextCoords() {
		const { coords } = this

		return units.reduce((result, { coordName }) => {
			result[coordName] = coords[coordName] + this._getCoordStep(coordName)

			return result
		}, {})
	}

	get nextCenterCoords() {
		const { nextCoords, size } = this
		const halfSize = Math.round(size / 2)

		return units.reduce((result, { coordName }) => {
			result[coordName] = nextCoords[coordName] + halfSize

			return result
		}, {})
	}

	get directions() {
		return this._directions
	}

	static getRandomDirections() {
		const directions = units.reduce((result, { coordName }) => {
			result[coordName] = BallsItem.getRandomDirection({ zero: true })

			return result
		}, {})

		if (directions.x + directions.y === 0) {
			const randCoordName = units[random(0, 1)].coordName

			directions[randCoordName] = BallsItem.getRandomDirection()
		}

		return directions
	}

	static getRandomDirection({ zero = false } = {}) {

		if (zero) {
			return random(-1, 1)
		}

		return random() === 0 ? -1 : 1
	}

	_onResize({ containerRect }) {
		const { size } = this

		this._max = {
			x: containerRect.width - size,
			y: containerRect.height - size,
		}
	}

	_getCoordStep(coordName) {
		return this._directions[coordName] * this.step
	}

	_display() {
		const elem = document.createElement('div')
		const { size, color, number } = this

		const styles = {
			width: `${ size }px`,
			height: `${ size }px`,
			'font-size': `${ size * FONT_SIZE_RATIO }px`,
			background: color,
		}

		Object
			.keys(defaultProps)
			.forEach((prop) => {
				elem[prop] = defaultProps[prop]
			})

		elem.style.cssText = Object
			.keys(styles)
			.map(prop => `${ prop }:${ styles[prop] }`)
			.join(';')

		elem.textContent = number

		this._elem = elem

		this._onResize({ containerRect: this._containerRect })
		this._setPosition()
		this._container.appendChild(elem)
	}

	_move({ newPosition = true }) {
		const { coords } = this

		if (newPosition) {
			units.forEach(({ coordName }) => {
				coords[coordName] += this._getCoordStep(coordName)
			})
		}

		this._setPosition()

		this._animationId = requestAnimationFrame(this._move)
	}

	_setPosition() {
		const {
			coords,
			centerCoords,
			_directions: directions,
			_rotateSpeed: rotateSpeed,
			_rotateDirection: rotateDirection,
			_min: min,
			_max: max,
			_elem: elem,
		} = this

		units.forEach(({ coordName }) => {
			const coordValue = coords[coordName]
			const overflow = [ min[coordName] - coordValue, coordValue - max[coordName] ]

			if (overflow[0] > 0 || overflow[1] > 0) {
				coords[coordName] = (overflow[0] > 0)
					? min[coordName] + overflow[0]
					: max[coordName] - overflow[1]

				const oppositeCoord = coordName === 'x' ? 'y' : 'x'

				directions[coordName] *= -1
				directions[oppositeCoord] = BallsItem.getRandomDirection()
			}
		})

		this._rotate += rotateSpeed * rotateDirection

		elem.style.transformOrigin = `${ centerCoords.x } ${ centerCoords.y } 0`
		elem.style.transform = `translate3d(${ coords.x }px, ${ coords.y }px, 0)`
			+ ` rotate(${ this._rotate }deg)`


	}
}
