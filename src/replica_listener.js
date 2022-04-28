import { Observable } from "./observable.js";

/**
 * The interface for a replica-listener. A replica-listener is an object which
 * supports observer-like functionality for multiple different fields, and for
 * which you can create "replicas" which act as namespaces for the listeners
 * which are easily detached.
 *
 * The extent to which a listener supports the observable model is up to the
 * implementation; typically you should be able to get/set each field and add
 * a listener. This can cause for a reasonably large amount of boilerplate, so
 * consider using the ListenerOf interface to alleviate it.
 */
export class ReplicaListener {
    /**
     * @returns {Array.<this>} The replicas of this listener
     */
    get replicatedTo() {
        throw new Error('not implemented');
    }

    /**
     * Creates a new replica of this instance, which is updated when this
     * is updated and this is updated when the replica is updated. However,
     * the listeners are distinct between the two instances; you can add
     * a listener to the replica and then clear its listeners without
     * altering this instances listeners.
     *
     * This should return a copy of this instance with no listeners,
     * with replicatedTo set to this instance, and updates this instances
     * replicatedTo to the new replica.
     *
     * @returns {this} A replica of this fields
     */
    createReplica() {
        throw new Error('not implemented');
    }

    /**
     * Copy the state from the other instance into this one.
     * @param {this} other The other instance to copy from
     */
    copyFrom(other) {
        throw new Error('not implemented');
    }

    /**
     * Detaches this instance, copies the replicas from the other
     * instance into this one, then detaches the other instance.
     *
     * This results in no changes to this instances listeners, but
     * we now have the other instances replicas.
     *
     * If this instance has a single replica which is being used
     * as the authority / parent, this is a great way to "update"
     * the authority / parent.
     *
     * If that's not the case, i.e., this instances replicas
     * matter, but you need to replace the authority / parent, then
     * the better approach is to detach() the old parent,
     * copyFrom(the new parent), and attach(the new parent).
     *
     * @param {this} other The other instance to detach from
     */
    assume(other) {
        throw new Error('not implemented');
    }

    /**
     * Attaches this instance to the given replica, bidirectionally.
     *
     * @param {this} other The other instance to attach to
     */
    attach(other) {
        throw new Error('not implemented');
    }

    /**
     * Detaches this instance from all replicas, bidirectionally.
     *
     * This should result in this instance having an empty replicatedTo
     * and not being in any other replicas replicatedTo.
     */
    detach() {
        throw new Error('not implemented');
    }

    /**
     * For each field, if it has the key 'clone' and it corresponds to
     * a function, then that function is called. Otherwise, the value is
     * shallow copied.
     *
     * The returned object will have no replicas and no listeners but
     * the same fields and field values.
     *
     * @returns {this} A copy of this instance
     */
    clone() {
        throw new Error('not implemented');
    }
}

/**
 * The interface for a listener for a given field.
 * @template T The type of the field
 * @template {string} K The name of the field
 */
export class ListenerOf {
    /**
     * @param {K} field The name of the field
     * @returns {T} The value of the field
     */
    get(field) {
        throw new Error('not implemented');
    }

    /**
     * Sets the value of the given field. If this instance is a ReplicaListener,
     * this will also update all replicas.
     * @param {K} field The name of the field
     * @param {T} value The value of the field
     */
    set(field, value) {
        throw new Error('not implemented');
    }

    /**
     * Sets the value of the given field just like set(), except if there are
     * any listeners for that field which return a promise, this waits for all
     * those promises to resolve before this resolves.
     * @param {K} field The name of the field
     * @param {T} value The value to set
     * @returns {Promise.<void>} A promise which resolves when the field is set
     */
    setWithPromise(field, value) {
        throw new Error('not implemented');
    }

    /**
     * Adds a listener for the given field
     * @param {K} field The name of the field
     * @param {function(T) : any} listener The listener to call when
     *   the fields value changes
     */
    addListener(field, listener) {
        throw new Error('not implemented');
    }

    /**
     * Removes a listener for the given field
     * @param {K} field The name of the field
     * @param {function(T) : any} listener The listener to remove
     */
    removeListener(field, listener) {
        throw new Error('not implemented');
    }

    /**
     * Adds the given listener and invokes the function immediately. This
     * is convenient in some contexts.
     * @param {K} field The name of the field
     * @param {function(T) : any} listener The listener to add and invoke
     */
    addListenerAndInvoke(field, listener) {
        throw new Error('not implemented');
    }

    /**
     * Creates a new derivative observable for the given field, whose
     * value changing does not modify the field, but whose value is
     * changed to match the result of the function on the new value when
     * the field changes.
     * @template J
     * @param {K} field The name of the field
     * @param {function(T) : J} func The transformation function
     * @returns {Observable.<J>} The observable
     */
    newDerivativeObservable(field, func) {
        throw new Error('not implemented');
    }

    /**
     * Clears all listeners on the given field.
     * @param {K} [field] The name of the field. Omitted for all fields.
     */
    clearListeners(field) {
        throw new Error('not implemented');
    }
}

/**
 * The restricted interface for a read-only field which otherwise acts like
 * ListenerOf
 * @template T The type of the field
 * @template {string} K The name of the field
 */
export class GetterOf {
    /**
     * @param {K} field The name of the field
     * @returns {T} The value of the field
     */
    get(field) {
        throw new Error('not implemented');
    }
}

/**
 * A single listener for an ArrayListenerOf, which gets additional context
 * surrounding how the array was edited, which can improve performance
 * significantly.
 * @template T
 * @typedef {object} ArrayListener
 * @property {function(Array.<T>) : any} [set] Called when the fields
 *   value is completely replaced. Passed the new array
 * @property {function(number, number, ...T) : any} [splice] Called when
 *   the array is spliced. Passed start, deleteCount, and any new items
 *   inserted. Any array operation we think of as "one operation" can be
 *   converted into an equivalent singular splice (pop, shift, unshift,
 *   push, etc.)
 */

/**
 * Creates a standard ArrayListener using simpler to implement functions. In
 * practice this should get the vast majority of the performance improvement
 * from a splice-based listener, while being much simpler to implement.
 *
 * @template T
 * @param {object} splicer The simpler functions that make up the whole
 * @param {function(number, T) : any} splicer.insert Called when an item is
 *   inserted at the given index. If the index is 0, then T is now at index 0
 *   after this operation.
 * @param {function(number) : any} splicer.remove Called when an item is
 *   removed at the given index
 * @param {function(number, T) : any} [splicer.replace] Called when an item is
 *   replaced at the given index. If not implemented, we do a remove and insert.
 * @param {object} [kwargs] Optional keyword arguments
 * @param {any} [kwargs.thisArg] The thisArg to use for the splicer functions
 * @returns {ArrayListener.<T>} The full array listener
 */
export function simpleArrayListener(splicer, kwargs) {
    if (kwargs && kwargs.thisArg) {
        splicer.insert = splicer.insert.bind(kwargs.thisArg);
        splicer.remove = splicer.remove.bind(kwargs.thisArg);
        if (splicer.replace) {
            splicer.replace = splicer.replace.bind(kwargs.thisArg);
        }
    }

    let currentLength = 0;
    return {
        set: (arr) => {
            if (splicer.replace) {
                for (let i = 0; i < currentLength && i < arr.length; i++) {
                    splicer.replace(i, arr[i]);
                }

                if (currentLength <= arr.length) {
                    for (; currentLength < arr.length; currentLength++) {
                        splicer.insert(currentLength, arr[currentLength]);
                    }
                } else {
                    while (currentLength > arr.length) {
                        splicer.remove(--currentLength);
                    }
                }
            } else {
                while (currentLength > 0) {
                    splicer.remove(--currentLength);
                }

                for (; currentLength < arr.length; currentLength++) {
                    splicer.insert(currentLength, arr[currentLength]);
                }
            }
        },
        splice: (start, deleteCount, ...items) => {
            if (splicer.replace) {
                for (let i = 0; i < deleteCount && i < items.length; i++) {
                    splicer.replace(start + i, items[i]);
                }

                if (deleteCount >= items.length) {
                    for (let i = items.length; i < deleteCount; i++) {
                        splicer.remove(start + i);
                        currentLength--;
                    }
                } else {
                    for (let i = deleteCount; i < items.length; i++) {
                        splicer.insert(start + i, items[i]);
                        currentLength++;
                    }
                }
            } else {
                for (let i = 0; i < deleteCount; i++) {
                    splicer.remove(start + i);
                    currentLength--;
                }

                for (let i = 0; i < items.length; i++) {
                    splicer.insert(start + i, items[i]);
                    currentLength++;
                }
            }
        }
    }
}

/**
 * The interface for a listener of an array field. This listener is, itself,
 * a replica listener.
 *
 * Implementations of this interface SHOULD modify the array in place where doing
 * so may be more efficient.
 *
 * @template T The type of the array elements
 */
export class ArrayListenerOf extends ReplicaListener {
    /**
     * @returns {Array.<T>} The value of the field
     */
    get() {
        throw new Error('not implemented');
    }

    /**
     * @param {number} idx The index of the element to get
     * @returns {T} The value of the element at the given index, or
     *   undefined if the index is out of bounds
     */
    at(idx) {
        throw new Error('not implemented');
    }

    /**
     * Sets the value.
     * @param {Array.<T>} value The value of the field
     */
    set(value) {
        throw new Error('not implemented');
    }

    /**
     * Pushes the given element to the end of the array.
     * @param {T} element The element to push
     */
    push(element) {
        throw new Error('not implemented');
    }

    /**
     * Pops the last element off the array.
     * @returns {T} The element popped off the array
     */
    pop() {
        throw new Error('not implemented');
    }

    /**
     * Shifts the first element off the array.
     * @returns {T} The element shifted off the array
     */
    shift() {
        throw new Error('not implemented');
    }

    /**
     * Unshifts the given element to the front of the array.
     * @param {T} element The element to unshift
     */
    unshift(element) {
        throw new Error('not implemented');
    }

    /**
     * Splices the array at the given index, removing the given number of
     * elements, and inserting the given elements.
     * @param {number} start The index to start changing the array
     * @param {number} deleteCount The number of elements to remove
     * @param {...T} items The elements to insert
     * @returns {Array.<T>} The elements removed
     */
    splice(start, deleteCount, ...items) {
        throw new Error('not implemented');
    }

    /**
     * Sets the value of the given field just like set(), except if there are
     * any listeners for that field which return a promise, this waits for all
     * those promises to resolve before this resolves.
     * @param {Array.<T>} value The value to set
     * @returns {Promise.<void>} A promise which resolves when the field is set
     */
    setWithPromise(value) {
        throw new Error('not implemented');
    }

    /**
     * Pushes the given element to the end of the array just like push(), except
     * if there are any listeners for that field which return a promise, this
     * waits for all those promises to resolve before this resolves.
     * @param {T} element The element to push
     * @returns {Promise.<void>} A promise which resolves when the field is set
     */
    pushWithPromise(element) {
        throw new Error('not implemented');
    }

    /**
     * Pops the last element off the array just like pop(), except if there are
     * any listeners for that field which return a promise, this waits for all
     * those promises to resolve before this resolves.
     * @returns {Promise.<T>} A promise which resolves when the field is set
     */
    popWithPromise() {
        throw new Error('not implemented');
    }

    /**
     * Shifts the first element off the array just like shift(), except if there
     * are any listeners for that field which return a promise, this waits for
     * all those promises to resolve before this resolves.
     * @returns {Promise.<T>} A promise which resolves when the field is set
     */
    shiftWithPromise() {
        throw new Error('not implemented');
    }

    /**
     * Unshifts the given element to the front of the array just like unshift(),
     * except if there are any listeners for that field which return a promise,
     * this waits for all those promises to resolve before this resolves.
     * @param {T} element The element to unshift
     * @returns {Promise.<void>} A promise which resolves when the field is set
     */
    unshiftWithPromise(element) {
        throw new Error('not implemented');
    }

    /**
     * Splices the array at the given index, removing the given number of
     * elements, and inserting the given elements just like splice(), except if
     * there are any listeners for that field which return a promise, this
     * waits for all those promises to resolve before this resolves.
     * @param {number} start The index to splice at
     * @param {number} deleteCount The number of elements to remove
     * @param {...T} items The elements to insert
     * @returns {Promise.<Array.<T>>} A promise which resolves when the field is set
     */
    spliceWithPromise(start, deleteCount, ...items) {
        throw new Error('not implemented');
    }

    /**
     * Adds a listener for the given field. This is called whenever the array
     * changes but does not provide context for how it was modified, which can
     * be inefficient. Prefer the addArrayListener function.
     *
     * @param {function(Array.<T>) : any} listener The listener to call when
     *   the fields value changes
     */
    addListener(listener) {
        throw new Error('not implemented');
    }

    /**
     * Adds the given array multi-part listener. The function which is called
     * is provided additional context for how the array was modified, which
     * can be big-O more efficient (often from at least O(n) to O(1)).
     *
     * @param {ArrayListener.<T>} listener The listeners to call when the fields value
     *   changes
     */
    addArrayListener(listener) {
        throw new Error('not implemented');
    }

    /**
     * Removes a listener
     * @param {function(Array.<T>) : any} listener The listener to remove
     */
    removeListener(listener) {
        throw new Error('not implemented');
    }

    /**
     * Removes the given array multi-part listener. Compared using shallow
     * equality, meaning that it must be the exact same listener object.
     * @param {ArrayListener.<T>} listener The listeners to call when the fields value
     *   changes
     */
    removeArrayListener(listener) {
        throw new Error('not implemented');
    }

    /**
     * Adds the given listener and invokes the function immediately. This
     * is convenient in some contexts.
     * @param {function(Array.<T>) : any} listener The listener to add and invoke
     */
    addListenerAndInvoke(listener) {
        throw new Error('not implemented');
    }

    /**
     * Adds the given array multi-part listener and invokes the functions
     * immediately. This is convenient in some contexts.
     * @param {ArrayListener.<T>} listener The listeners to call when the fields value
     *   changes
     */
    addArrayListenerAndInvoke(listener) {
        throw new Error('not implemented');
    }

    /**
     * Creates a new derivative observable, whose value changing does not modify
     * the field, but whose value is changed to match the result of the function
     * on the new value when the field changes.
     * @template J
     * @param {function(Array.<T>) : J} func The transformation function
     * @returns {Observable.<J>} The observable
     */
    newDerivativeObservable(func) {
        throw new Error('not implemented');
    }

    /**
     * Clears all listeners.
     */
    clearListeners() {
        throw new Error('not implemented');
    }
}

/**
 * Our implementation for the ArrayListenerOf interface. We avoid exposing this
 * class directly in the docs to make it extremely clear that people should not
 * rely on this being the implementation they receive, for future mutability.
 *
 * @template T
 */
class ArrayListenerOfImpl {
    /**
     * @param {Array.<T>} value
     */
    constructor(value) {
        /**
         * @type {Array.<T>}
         * @private
         */
        this._value = value;

        /**
         * The array listeners
         * @type {Array.<ArrayListener.<T>>}
         * @private
         */
        this._arrayListeners = [];

        /**
         * The regular listeners
         * @type {Array.<function(Array.<T>) : any>}
         * @private
         */
        this._listeners = [];

        /**
         * @type {Array.<ArrayListenerOfImpl.<T>>}
         */
        this.replicatedTo = [];
    }

    /**
     * @returns {ArrayListenerOfImpl.<T>}
     */
    createReplica() {
        const res = new ArrayListenerOfImpl(this._value.slice());
        res.replicatedTo.push(this);
        this.replicatedTo.push(res);
        return res;
    }

    /**
     * @param {ArrayListenerOfImpl.<T>} other
     */
    copyFrom(other) {
        this.set(other.get().slice());
    }

    /**
     * @param {ArrayListenerOfImpl.<T>} other
     */
    assume(other) {
        assumeReplica(this, other);
    }

    /**
     * @param {ArrayListenerOfImpl.<T>} other
     */
    attach(other) {
        attachReplica(this, other);
    }

    /**
     * @returns {ArrayListenerOfImpl.<T>} a clone of this
     */
    clone() {
        return new ArrayListenerOfImpl(this._value.map(v => {
            if (typeof(v) === 'object' && v !== null && typeof(v['clone']) === 'function') {
                return v['clone']();
            }
            return v;
        }));
    }

    /**
     */
    detach() {
        detachReplica(this);
    }

    /**
     * @returns {Array.<T>}
     */
    get() {
        return this._value;
    }

    /**
     * @param {number} index
     * @returns {T}
     */
    at(index) {
        return this._value[index];
    }

    /**
     * @param {Array.<T>} value
     */
    set(value) {
        recurseReplicas(
            this,
            /** @param {ArrayListenerOfImpl.<T>} replica */
            (replica) => {
                replica._value = value.slice();
                replica._arrayListeners.forEach(listener => {
                    if (listener.set) {
                        listener.set(replica._value);
                    }
                });
                replica._listeners.forEach(listener => {
                    listener(replica._value);
                });
            }
        );
    }

    /**
     * @param {T} element
     */
    push(element) {
        this.splice(this._value.length, 0, element);
    }

    /**
     * @returns {T}
     */
    pop() {
        return this.splice(this._value.length - 1, 1)[0];
    }

    /**
     * @returns {T}
     */
    shift() {
        return this.splice(0, 1)[0];
    }

    /**
     * @param {T} element
     */
    unshift(element) {
        this.splice(0, 0, element);
    }

    /**
     * @param {number} start
     * @param {number} deleteCount
     * @param {...T} items
     * @returns {Array.<T>} The deleted elements
     */
    splice(start, deleteCount, ...items) {
        let deleted = null;
        recurseReplicas(
            this,
            (
                /** @param {ArrayListenerOfImpl.<T>} replica */
                (replica) => {
                    const replicaDeleted = replica._value.splice(start, deleteCount, ...items);
                    if (replica === this) {
                        deleted = replicaDeleted;
                    }
                    replica._arrayListeners.forEach(listener => {
                        if (listener.splice) {
                            listener.splice(start, deleteCount, ...items);
                        }
                    });
                    replica._listeners.forEach(listener => {
                        listener(replica._value);
                    });
                }
            ).bind(this)
        );
        return deleted;
    }

    /**
     * @param {Array.<T>} value
     * @returns {Promise.<void>}
     */
    async setWithPromise(value) {
        let promises = [];
        recurseReplicas(
            this,
            /** @param {ArrayListenerOfImpl.<T>} replica */
            (replica) => {
                replica._value = value.slice();
                replica._arrayListeners.forEach(listener => {
                    if (listener.set) {
                        const res = listener.set(replica._value);
                        if (res instanceof Promise) {
                            promises.push(res);
                        }
                    }
                });
                replica._listeners.forEach(listener => {
                    const res = listener(replica._value);
                    if (res instanceof Promise) {
                        promises.push(res);
                    }
                });
            }
        );

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    /**
     * @param {T} element
     * @returns {Promise.<void>}
     */
    async pushWithPromise(element) {
        await this.spliceWithPromise(this._value.length, 0, element);
    }

    /**
     * @returns {Promise.<T>}
     */
    async popWithPromise() {
        return (await this.spliceWithPromise(this._value.length - 1, 1))[0];
    }

    /**
     * @returns {Promise.<T>}
     */
    async shiftWithPromise() {
        return (await this.spliceWithPromise(0, 1))[0];
    }

    /**
     * @param {T} element
     * @returns {Promise.<void>}
     */
    async unshiftWithPromise(element) {
        await this.spliceWithPromise(0, 0, element);
    }

    /**
     * @param {number} start
     * @param {number} deleteCount
     * @param {...T} items
     * @returns {Promise.<Array.<T>>} The deleted elements
     */
    async spliceWithPromise(start, deleteCount, ...items) {
        let deleted = null;
        let promises = [];
        recurseReplicas(
            this,
            (
                /** @param {ArrayListenerOfImpl.<T>} replica */
                (replica) => {
                    const replicaDeleted = replica._value.splice(start, deleteCount, ...items);
                    if (replica === this) {
                        deleted = replicaDeleted;
                    }
                    replica._arrayListeners.forEach(listener => {
                        if (listener.splice) {
                            const res = listener.splice(start, deleteCount, ...items);
                            if (res instanceof Promise) {
                                promises.push(res);
                            }
                        }
                    });
                    replica._listeners.forEach(listener => {
                        const res = listener(replica._value);
                        if (res instanceof Promise) {
                            promises.push(res);
                        }
                    });
                }
            ).bind(this)
        );

        if (promises.length > 0) {
            await Promise.all(promises);
        }
        return deleted;
    }

    /**
     * @param {function(Array.<T>) : any} listener
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * @param {ArrayListener.<T>} listener
     */
    addArrayListener(listener) {
        this._arrayListeners.push(listener);
    }

    /**
     * @param {function(Array.<T>) : any} listener
     */
    removeListener(listener) {
        this._listeners = this._listeners.filter(l => l !== listener);
    }

    /**
     * @param {ArrayListener.<T>} listener
     */
    removeArrayListener(listener) {
        this._arrayListeners = this._arrayListeners.filter(l => l !== listener);
    }

    /**
     * @param {function(Array.<T>) : any} listener
     */
    addListenerAndInvoke(listener) {
        this.addListener(listener);
        listener(this._value);
    }

    /**
     * @param {ArrayListener.<T>} listener
     */
    addArrayListenerAndInvoke(listener) {
        this.addArrayListener(listener);
        listener.set(this._value);
    }

    /**
     * @template J
     * @param {function(Array.<T>) : J} func The transformation function
     * @returns {Observable.<J>} The observable
     */
    newDerivativeObservable(func) {
        const res = new Observable(func(this._value));
        this.addListener(val => {
            res.value = func(val);
        });
        return res;
    }

    clearListeners() {
        this._listeners = [];
        this._arrayListeners = [];
    }
}

/**
 * Creates a new standalone ArrayListenerOf the given value.
 * @template T
 * @param {Array.<T>} value The value
 * @returns {ArrayListenerOf.<T>} The constructed ArrayListenerOf
 */
export function newArrayListenerOf(value) {
    return new ArrayListenerOfImpl(value);
}

/**
 * Applies the given function to all replicas of the given replica-listener.
 * This normally is used to implement the ReplicaListener rather than as
 * something called on a replica listener.
 *
 * @template {ReplicaListener} T
 * @param {T} replica The replica listener
 * @param {function(T) : any} fn The function to execute on the replica
 */
export function recurseReplicas(replica, fn) {
    /** @type {Array.<T>} */
    let alreadyReplicatedTo = [];
    let stack = replica.replicatedTo.slice();
    stack.unshift(replica);
    while (stack.length > 0) {
        const ele = stack.pop();
        if (alreadyReplicatedTo.includes(ele)) {
            continue;
        }

        fn(ele);
        alreadyReplicatedTo.push(ele);
        for (let e of ele.replicatedTo) {
            stack.push(e);
        }
    }
}

/**
 * A default implementation of attach for a replica listener. Usually
 * used to implement the attach() function.
 *
 * @param {ReplicaListener} a The first listener
 * @param {ReplicaListener} b The second listener
 */
export function attachReplica(a, b) {
    a.replicatedTo.push(b);
    b.replicatedTo.push(a);
}

/**
 * A default implementation of detach for a replica listener. Usually
 * used to implement the detach() function.
 *
 * @param {ReplicaListener} replica The replica listener to detach
 */
export function detachReplica(replica) {
    for (let replicaListener of replica.replicatedTo) {
        replicaListener.replicatedTo.splice(
            replicaListener.replicatedTo.indexOf(replica),
            1
        );
    }

    while (replica.replicatedTo.length > 0) {
        replica.replicatedTo.pop();
    }
}

/**
 * A default implementation of assume for a replica listener. Usually
 * used to implement the assume() function
 *
 * @param {ReplicaListener} a The replica listener doing the assuming
 * @param {ReplicaListener} b The replica listener being assumed
 */
export function assumeReplica(a, b) {
    a.detach();
    a.copyFrom(b);
    for (const replica of b.replicatedTo) {
        a.replicatedTo.push(replica);
    }
    b.detach();
}


/**
 * Our implementation of ReplicaListener and ListenerOf for any number of
 * fields. This does not have full type information as it is very generic,
 * hence we instead export the typed version via implementReplicaListener
 */
class ReplicaListenerImpl {
    /**
     * @param {Array.<{key: string, val: any}>} fields The fields which we have
     */
    constructor(fields) {
        /**
         * @type {Object.<string, Observable.<any>>} The fields
         * @private
         */
        this._fields = {};
        for (const f of fields) {
            this._fields[f.key] = new Observable(f.val);
        }

        /**
         * @type {Array.<ReplicaListenerImpl>}
         */
        this.replicatedTo = [];
    }

    createReplica() {
        const res = new ReplicaListenerImpl(
            Object.entries(this._fields).map(
                ([key, val]) => ({key, val: val.value})
            )
        );

        res.replicatedTo.push(this);
        this.replicatedTo.push(res);

        return res;
    }

    /**
     * @param {this} other
     */
    copyFrom(other) {
        for (const key of Object.keys(this._fields)) {
            this.set(key, other.get(key));
        }
    }

    /**
     * @param {this} other The other instance to detach from
     */
    assume(other) {
        assumeReplica(this, other);
    }

    /**
     * @param {this} other The other instance to attach
     */
    attach(other) {
        attachReplica(this, other);
    }

    detach() {
        detachReplica(this);
    }

    /**
     * @returns {this} a deep copy of this instance
     */
    clone() {
        const newFields = [];
        for (const key of Object.keys(this._fields)) {
            const val = this._fields[key];
            if (typeof(val.value) === 'object' && val.value !== null && typeof(val.value['clone']) === 'function') {
                newFields.push({key: key, val: val.value['clone']()});
            } else {
                newFields.push({key: key, val: val.value});
            }
        }
        // @ts-ignore
        return new ReplicaListenerImpl(newFields);
    }

    /**
     * @param {string} field
     * @returns {any}
     */
    get(field) {
        return this._fields[field].value;
    }

    /**
     * @param {string} field
     * @param {any} value
     */
    set(field, value) {
        recurseReplicas(
            this,
            /** @param {ReplicaListenerImpl} replica */
            (replica) => replica._fields[field].value = value
        );
    }

    /**
     * @param {string} field
     * @param {any} value
     * @returns {Promise.<void>}
     */
    async setWithPromise(field, value) {
        let promises = [];
        recurseReplicas(
            this,
            /** @param {ReplicaListenerImpl} replica */
            (replica) => promises.push(replica._fields[field].setValueWithPromise(value))
        );
        await Promise.all(promises);
    }

    /**
     * @param {string} field
     * @param {function(any) : any} listener
     */
    addListener(field, listener) {
        this._fields[field].addListener(listener);
    }

    /**
     * @param {string} field
     * @param {function(any) : any} listener
     */
    removeListener(field, listener) {
        this._fields[field].removeListener(listener);
    }

    /**
     * @param {string} field
     * @param {function(any) : any} listener
     */
    addListenerAndInvoke(field, listener) {
        this._fields[field].addListenerAndInvoke(listener);
    }

    /**
     * @template J
     * @param {string} field
     * @param {function(any) : J} func
     * @returns {Observable.<J>}
     */
    newDerivativeObservable(field, func) {
        return this._fields[field].newDerivativeObservable(func);
    }

    /**
     * @param {string} [field]
     */
    clearListeners(field) {
        if (field) {
            this._fields[field].clearListeners();
        } else {
            for (const f of Object.keys(this._fields)) {
                this._fields[f].clearListeners();
            }
        }
    }

    toString() {
        return '[ReplicaListenerImpl ' + Object.entries(this._fields).map(s => s.toString()).join(', ') + ']';
    }
}

/**
 * Adds a listener to an observable of a particular listener, in such a way
 * that the listener is only ever applied to a single listener and the observable
 * can be set and the listener is still called.
 *
 * For example
 *
 * ```js
 * const a = new Observable(implementReplicaListener([{key: 'foo', val: 3}]));
 * const listener = (val) => console.log(val);
 *
 * addWrappedListener(a, 'foo', listener, { invoke: true }); // prints 3
 * let oldVal = a.value;
 * a.value = implementReplicaListener([{key: 'foo', val: 4}]); // prints 4
 * a.value.set('foo', 5); // prints 5
 * oldVal.set('foo', 6); // doesn't print anything
 * ```
 *
 * @template V The value type of the field
 * @template {string} K
 * @param {Observable.<ListenerOf.<V, K>>} replica
 * @param {K} field
 * @param {function(V) : any} listener
 * @param {object} [kwargs]
 * @param {boolean} [kwargs.invoke=false] If true, we invoke the listener with
 *   the current value of the field when we add it, unless the observable is not
 *   set.
 */
export function addWrappedListener(replica, field, listener, kwargs) {
    const {invoke} = Object.assign({invoke: false}, kwargs);

    if (invoke && replica.value !== null) {
        listener(replica.value.get(field));
    }

    let curVal = replica.value;
    if (curVal !== null) {
        curVal.addListener(field, listener);
    }
    replica.addListener(val => {
        if (curVal !== null) {
            curVal.removeListener(field, listener);
        }

        curVal = val;
        if (val !== null) {
            val.addListenerAndInvoke(field, listener);
        }
    });
}

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA
 * @template {string} KA
 * @param {{key: KA, val: VA}} a The first field
 * @returns {ReplicaListener & ListenerOf<VA, KA>} The new instance
 */
export function implementReplicaListener(a); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB
 * @template {string} KA
 * @template {string} KB
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB>}} The new instance
 */
export function implementReplicaListener(a, b); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC>} The new instance
 */
export function implementReplicaListener(a, b, c); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD>} The new instance
 */
export function implementReplicaListener(a, b, c, d); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE,VF
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @template {string} KF
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @param {{key: KF, val: VF}} f The sixth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE> & ListenerOf<VF, KF>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e, f); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE,VF,VG
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @template {string} KF
 * @template {string} KG
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @param {{key: KF, val: VF}} f The sixth field
 * @param {{key: KG, val: VG}} g The seventh field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE> & ListenerOf<VF, KF> & ListenerOf<VG, KG>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e, f, g); // @@type-hint


/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE,VF,VG,VH
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @template {string} KF
 * @template {string} KG
 * @template {string} KH
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @param {{key: KF, val: VF}} f The sixth field
 * @param {{key: KG, val: VG}} g The seventh field
 * @param {{key: KH, val: VH}} h The eighth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE> & ListenerOf<VF, KF> & ListenerOf<VG, KG> & ListenerOf<VH, KH>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e, f, g, h); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE,VF,VG,VH,VI
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @template {string} KF
 * @template {string} KG
 * @template {string} KH
 * @template {string} KI
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @param {{key: KF, val: VF}} f The sixth field
 * @param {{key: KG, val: VG}} g The seventh field
 * @param {{key: KH, val: VH}} h The eighth field
 * @param {{key: KI, val: VI}} i The ninth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE> & ListenerOf<VF, KF> & ListenerOf<VG, KG> & ListenerOf<VH, KH> & ListenerOf<VI, KI>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e, f, g, h, i); // @@type-hint

/**
 * Creates a new instance which implements both ReplicaListener and ListenerOf
 * for each field.
 *
 * @template VA,VB,VC,VD,VE,VF,VG,VH,VI,VJ
 * @template {string} KA
 * @template {string} KB
 * @template {string} KC
 * @template {string} KD
 * @template {string} KE
 * @template {string} KF
 * @template {string} KG
 * @template {string} KH
 * @template {string} KI
 * @template {string} KJ
 * @param {{key: KA, val: VA}} a The first field
 * @param {{key: KB, val: VB}} b The second field
 * @param {{key: KC, val: VC}} c The third field
 * @param {{key: KD, val: VD}} d The fourth field
 * @param {{key: KE, val: VE}} e The fifth field
 * @param {{key: KF, val: VF}} f The sixth field
 * @param {{key: KG, val: VG}} g The seventh field
 * @param {{key: KH, val: VH}} h The eighth field
 * @param {{key: KI, val: VI}} i The ninth field
 * @param {{key: KJ, val: VJ}} j The tenth field
 * @returns {ReplicaListener & ListenerOf<VA, KA> & ListenerOf<VB, KB> & ListenerOf<VC, KC> & ListenerOf<VD, KD> & ListenerOf<VE, KE> & ListenerOf<VF, KF> & ListenerOf<VG, KG> & ListenerOf<VH, KH> & ListenerOf<VI, KI> & ListenerOf<VJ, KJ>} The new instance
 */
export function implementReplicaListener(a, b, c, d, e, f, g, h, i, j); // @@type-hint

/**
 * Returns a new instance which is both a ReplicaListener and a ListenerOf
 * for each of the fields. This function loses type information but does
 * not have a limit on the number of observables. We provide exports for
 * up to 9 observables which include type information. If you have more,
 * you need to force the returned type to the correct one to get type info.
 *
 * @param {...{key: any, val: any}} fields
 * @returns {ReplicaListener} The new instance
 */
export function implementReplicaListener(...fields) {
    return new ReplicaListenerImpl(fields);
}
