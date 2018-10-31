import { random, throttle } from 'lodash'
import ColorHash from 'color-hash'
import { autobind } from 'core-decorators'

import Component from '~/libs/Component'
import units from '~/constants/units'

import BallsItem from './BallsItem/BallsItem'

import './Balls.css'

const CLICK_THROTTLE_TIMEOUT = 200
const STEP_ACCELERATION_RATIO = 1 / 4
const MIN_ROTATION_SPEED = 0.3
const MAX_ROTATION_SPEED = 6

const colorHash = new ColorHash()

export default @autobind class Balls extends Component {

	constructor({
		container,
		containerRect,
		quantity,
		size,
		minSize,
		minStep,
		maxStep,
	}) {
		super()

		if (quantity % 2 === 0) {
			quantity += 1
		}

		Object.assign(this, {
			_container: container,
			_containerRect: containerRect,
			_minSize: minSize,
			_minStep: minStep,
			_maxStep: maxStep,
			_initialSize: size,
			_items: [],
			_busyAreas: [],
		})

		this.on('resize', this._onResize)
		container.addEventListener('click', throttle(this._onClick, CLICK_THROTTLE_TIMEOUT))

		this._createItems({ quantity })
	}

	start() {
		this._started = true

		this._items.forEach(item => item.start())

		this._animationId = requestAnimationFrame(this._checkForСollision)

		delete this._busyAreas
	}

	stop() {
		this._started = false

		cancelAnimationFrame(this._animationId)

		this._items.forEach(item => item.stop())
	}

	remove() {
		this.stop()
		this._container.removeEventListener('click', this._onClick)
		this._items.forEach(item => item.remove())
	}

	_onResize({ containerRect }) {
		this._containerRect = containerRect
		this._items.forEach(item => item.emit('resize', { containerRect }))
	}

	_onClick(e) {

		if (!this._started) {
			return
		}

		const {
			_items: items,
			_initialSize: size,
			_containerRect: containerRect,
		} = this

		const number = items.length
		const id = number + Math.random()
		const step = this._getRandomStep()
		const halfSize = Math.round(size / 2)

		const item = this._createItem({
			coords: {
				x: e.pageX - halfSize - containerRect.left,
				y: e.pageY - halfSize - containerRect.top,
			},
			color: colorHash.hex(id),
			number,
			size,
			step,
		})

		item.start()
	}

	_createItems({ quantity }) {
		const { _initialSize: size } = this
		const rand = Math.random()

		for (let i = 0; i < quantity; i++) {
			const step = this._getRandomStep()

			const item = this._createItem({
				coords: this._getInitialItemCoords({ step }),
				color: colorHash.hex(i + rand),
				number: i + 1,
				size,
				step,
			})

			this._addBusyArea({ coords: item.coords })
		}
	}

	_getRandomStep() {
		const {
			_minStep: minStep,
			_maxStep: maxStep,
		} = this

		return random(minStep, maxStep)
	}

	_createItem({
		coords,
		size,
		color,
		number,
		step,
		directions,
		rotateSpeed,
	} = {}) {
		const {
			_container: container,
			_containerRect: containerRect,
		} = this

		const item = new BallsItem({
			container,
			containerRect,
			coords,
			size,
			color,
			number,
			step,
			directions,
			rotateSpeed,
		})

		this._items.push(item)

		return item
	}

	_getInitialItemCoords({ step }) {
		const {
			_initialSize: size,
			_containerRect: containerRect,
		} = this

		const max = units.reduce((result, { coordName, sizeName }) => {
			result[coordName] = containerRect[sizeName] - size

			return result
		}, {})


		const coords = units.reduce((result, { coordName, sizeName }) => {
			result[coordName] = random(0, containerRect[sizeName] - size)

			return result
		}, {})

		const margin = step + random(1, step)
		let checkResult = this._findFreeAreas({
			coords,
			margin,
		})

		while (checkResult.isBusy) {
			coords.x = checkResult.busyArea.x[1] + margin

			if (coords.x > max.x) {
				coords.x = margin
				coords.y += 1
			}

			if (coords.y > max.y) {
				coords.y = margin
			}

			checkResult = this._findFreeAreas({
				coords,
				margin,
			})
		}

		return coords
	}

	_findFreeAreas({ coords, margin }) {
		const {
			_initialSize: size,
			_busyAreas: busyAreas,
		} = this

		const busyArea = busyAreas.find((area) => {

			return units.every(({ coordName }) => {
				const coord1 = coords[coordName]
				const coord2 = coord1 + size
				const busyCoord1 = area[coordName][0] - margin
				const busyCoord2 = area[coordName][1] + margin

				return (
					coord1 > busyCoord1
					&& coord1 < busyCoord2
				) || (
					coord2 > busyCoord1
					&& coord2 < busyCoord2
				)
			})
		})

		return {
			isBusy: Boolean(busyArea),
			busyArea,
		}
	}

	_checkForСollision() {
		const { _items: items } = this
		let numItems = items.length

		if (numItems === 1) {
			const winnerItem = items[0]

			winnerItem.stop()
			this.emit('win', { winnerItem })

			return
		}

		for (let i = 0; i < numItems - 1; i++) {
			const item1 = items[i]

			for (let j = i + 1; j < numItems; j++) {
				const item2 = items[j]
				const avgItemsSize = (item1.size + item2.size) / 2

				const nextCenterCoordsDiffs = units.reduce((result, { coordName }) => {
					result[coordName] = Math.abs(
						item1.nextCenterCoords[coordName] - item2.nextCenterCoords[coordName]
					)

					return result
				}, {})

				if (nextCenterCoordsDiffs.x < avgItemsSize && nextCenterCoordsDiffs.y < avgItemsSize) {
					this._splitItems(item1, item2)

					items.splice(j, 1)
					items.splice(i, 1)

					i -= 1
					numItems -= 2

					break
				}
			}
		}

		this._animationId = requestAnimationFrame(this._checkForСollision)
	}

	_splitItems(item1, item2) {
		const {
			_minSize: minSize,
			_rotateDirection: rotateDirection,
		} = this

		const diffX = Math.abs(item1.centerCoords.x - item2.centerCoords.x)
		const diffY = Math.abs(item1.centerCoords.y - item2.centerCoords.y)

		const collisionCoordName = diffX > diffY ? 'x' : 'y'
		const oppositeCoordName = (collisionCoordName === 'x') ? 'y' : 'x'

		const avgItemsSize = (item1.size + item2.size) / 2
		const collisionDiff = Math.abs(
			item1.centerCoords[collisionCoordName] - item2.centerCoords[collisionCoordName]
		)

		const collisionGap = collisionDiff - avgItemsSize
		const collisionGap1 = Math.round(collisionGap / 2)
		const collisionGaps = [ collisionGap1, collisionGap - collisionGap1 ]

		const collisionCoord1 = item1.coords[collisionCoordName]
		const collisionCoord2 = item2.coords[collisionCoordName]
		const newItemsOffsets = (collisionCoord1 - collisionCoord2 < 0)
			? [ Math.ceil(item1.size / 2), 0 ]
			: [ 0, Math.ceil(item2.size) / 2 ]

		const items = [ item1, item2 ]

		for (let i = 0; i < 2; i++) {
			const item = items[i]
			const newSize = Math.floor(item.size / 2)

			item.remove()

			if (newSize <= minSize) {
				continue
			}

			const neighborItem = items[Number(!i)]

			const step = ((neighborItem.size / 2) <= minSize)
				? Math.max(item.step, neighborItem.step) * STEP_ACCELERATION_RATIO
				: item.step + (STEP_ACCELERATION_RATIO * Number(item.size < neighborItem.size))

			const collisionDirection = item.directions[collisionCoordName]

			const params = {
				coords: {
					[oppositeCoordName]: item.nextCoords[oppositeCoordName],
					[collisionCoordName]: item.coords[`${ collisionCoordName }`]
						+ newItemsOffsets[i]
						+ (collisionGaps[i] * item.directions[collisionCoordName]),
				},
				directions: {
					[oppositeCoordName]: -1,
					[collisionCoordName]: (collisionDirection !== 0)
						? -collisionDirection
						: neighborItem.directions[collisionCoordName],
				},
				step,
				color: item.color,
				number: item.number,
				size: newSize,
				rotateSpeed: random(MIN_ROTATION_SPEED, MAX_ROTATION_SPEED, true),
				rotateDirection,
			}

			const newItem1 = this._createItem({ ...params })
			const newItem2 = this._createItem({
				...params,
				coords: {
					...params.coords,
					[oppositeCoordName]: params.coords[oppositeCoordName] + newSize,
				},
				directions: {
					...params.directions,
					[oppositeCoordName]: 1,
				},
			})

			newItem1.start(newItem1)
			newItem2.start(newItem1)
		}
	}

	_addBusyArea({ coords }) {
		const { _initialSize: size } = this

		const busyArea = units.reduce((result, { coordName }) => {
			const coordValue = coords[coordName]

			result[coordName] = [ coordValue, coordValue + size ]

			return result
		}, {})

		this._busyAreas.push(busyArea)
	}
}
