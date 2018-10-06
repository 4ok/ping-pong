export default {

	on(eventName, callback) {
		const { _eventsCalbacks: eventsCalbacks } = this

		if (!eventsCalbacks[eventName]) {
			eventsCalbacks[eventName] = []
		}

		eventsCalbacks[eventName].push(callback)
	},

	off(eventName, callback) {
		const eventCallbacks = this._eventsCalbacks[eventName]

		if (eventCallbacks) {

			for (let i = 0; i < eventCallbacks.length; i++) {

				if (eventCallbacks[i] === callback) {
					eventCallbacks.splice(i, 1)
					break
				}
			}
		}
	},

	emit(eventName, params) {
		const { _eventsCalbacks: eventsCalbacks } = this

		if (eventsCalbacks[eventName]) {
			eventsCalbacks[eventName].map(callback => callback(params))
		}
	},
}
