import events from '~/mixins/events'

class Component {
	_eventsCalbacks = []
}

Object.assign(Component.prototype, events)

export default Component
