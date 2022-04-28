/**
 * Basic class for a value which reports to listeners when it changes.
 * @template T
 */
 export class Observable {
    /**
     * @param {T} value The initial value.
     */
    constructor(value) {
        /**
         * The current value
         * @type {T}
         * @private
         */
        this._value = value;

        /**
         * The list of change listeners
         * @type {Array.<function(T) : any>}
         * @private
         */
        this._listeners = [];
    }

    /**
     * @return {T} The current value.
     */
    get value() {
        return this._value;
    }

    /**
     * Set the current value and notify listeners
     * @param {T} value The new value.
     */
    set value(value) {
        this._value = value;
        this._notifyListeners();
    }

    /**
     * Set the current value and notify listeners. If the listeners return
     * promises, wait for all of them to resolve before the result is resolved.
     * @param {T} value The new value.
     * @return {Promise.<any>} A promise which resolves when all listeners have
     *   been notified.
     */
    async setValueWithPromise(value) {
        this._value = value;
        await this._notifyListeners();
    }

    /**
     * Add a new listener which is notified when the value changes.
     * @param {function(T) : any} listener The listener to add
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes the listener
     * @param {function(T) : any} listener The listener to remove
     */
    removeListener(listener) {
        const index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    /**
     * Adds the given listener and invokes the function immediately. This
     * is convenient in some contexts.
     * @param {function(T) : any} listener The listener to add and invoke
     */
    addListenerAndInvoke(listener) {
        this.addListener(listener);
        listener(this._value);
    }

    /**
     * Creates a new observable which has the result of the given function
     * on this observable as its value. Changing the returned observable does
     * not effect this observable.
     * @template J
     * @param {function(T) : J} fn The function to apply to the value of this
     *   observable to get the value of the derived obvserable.
     * @returns {Observable.<J>} The new derived observable
     */
    newDerivativeObservable(fn) {
        const res = new Observable(fn(this._value));
        this.addListener(value => res.value = fn(value));
        return res;
    }

    /**
     * Removes all listeners without invoking them.
     */
    clearListeners() {
        this._listeners = [];
    }

    /**
     * Notify all listeners that the value has changed.
     * @private
     */
    async _notifyListeners() {
        const promises = [];
        for (const listener of this._listeners) {
            const res = listener(this._value);
            if (res instanceof Promise) {
                promises.push(res);
            }
        }

        if (promises) {
            await Promise.all(promises);
        }
    }

    toString() {
        return `Observable(${this._value})`;
    }
}
