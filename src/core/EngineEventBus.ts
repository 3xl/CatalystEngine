import { EngineEvents, EventCallback } from '../interfaces/index';

type ListenerMap = { [K in keyof EngineEvents]?: EventCallback<EngineEvents[K]>[] };

export class EngineEventBus {
    private listeners: ListenerMap = {};

    public on<K extends keyof EngineEvents>(event: K, callback: EventCallback<EngineEvents[K]>): void {
        let eventListeners = this.listeners[event];
        if (!eventListeners) {
            eventListeners = [];
            this.listeners[event] = eventListeners as ListenerMap[K];
        }
        eventListeners.push(callback);
    }

    public off<K extends keyof EngineEvents>(event: K, callback: EventCallback<EngineEvents[K]>): void {
        const eventListeners = this.listeners[event];
        if (!eventListeners) return;
        this.listeners[event] = eventListeners.filter(cb => cb !== callback) as ListenerMap[K];
    }

    public emit<K extends keyof EngineEvents>(event: K, data: EngineEvents[K]): void {
        const eventListeners = this.listeners[event];
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }
}
