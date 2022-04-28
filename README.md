# ReplicaListenerJS

This package provides a sane way to pass mutable state around which is less
unwieldy than Redux. It's primarily intended for component systems where
bidirectional state mutation is common.

A core feature of this package is that when using Visual Studio Code with the
standard Typescript intellisense enabled, the intellisense knows what fields
are available and what types they have.

## Importing

Versioned releases export the `rl.js` and `rl.js.min` which are expected to be
included in your project directly. `rl.js` is almost plain JavaScript built on ES6.
`rl.js.min` is a minified version of `rl.js` with no type support and is completely
plain javascript.

In order for `rj.js` to run in the browser you will need to process it to comment
out the lines ending with `// @@type-hint` as they are non-standard.

## Usage

There are three primary exports:

- `Observable`, which is a simple wrapper around a value with a getter/setter,
  where setting the value invokes callbacks. This is an actual class.
- `ReplicaListener`, which is an interface that describes something that itself
  has listeners and replicates its state to a list of other replica listeners.
- `ArrayListenerOf` describes an array-like variant of replica listener.


Focusing on just the ReplicaListener, you typically define an interface which implements
`ReplicaListener` and `ListenerOf.<T, K>` for multiple keys. For example:

```js
/**
 * A message that the user made
 * @typedef {ReplicaListener & ListenerOf.<string, 'message'> & ListenerOf.<Date, 'createdAt'> & ListenerOf.<Date, 'lastEdited'>} Message
 */
```

And a constructor, which is also used to document what the fields mean:

```js
/**
 * @param {string} message The message that was posted
 * @param {Date} createdAt When the message was posted
 * @param {Date} lastEdited When the message was last edited
 * @returns {Message}
 */
export function newMessage(message, createdAt, lastEdited) {
    return implementReplicaListener(
        {key: 'message', val: message},
        {key: 'createdAt', val: createdAt},
        {key: 'lastEdited', val: lastEdited}
    );
}
```

Note that if you were to make a typo or omit one of the keys, the returned
replica listener would not properly implement the `Message` interface, and you
would get an error from VSCode. For example, if we simplify and consider a
message class with just two fields, message, and createdAt, if you accidentally
wrote `messageA`, the IDE would give a red underline:

![Red underline](/docs/messageA.png)

and provide a somewhat useful error message:

![Error message](/docs/messageAError.png)

Then, to use the Message class, you can set the values; again, the IDE knows
what fields are available and will error if the key does not exist or the value
type does not match. Further, it will be able to suggest valid fields:

```js
const message = newMessage('Hello, world!', new Date());

message.set('message', 'Foo bar');

const autoUpdatingElement = (() => {
    const res = document.createElement('span');
    message.addListenerAndInvoke('message', (msg) => {
        res.textContent = msg;
    });
    return res;
})();
```

However, this is all for basic listeners. The _replica_ part of ReplicaListener
means you can create another copy of the Message which updates with the message
but has separate listeners. This is typically used when nesting components.
The general idea is as follows:

Suppose we have are showing messages like above in a view, where we have one
component that's responsible for showing the message and editing the message,
and one component which is responsible for showing when the message was created
and last edited. When editing the message, the last edit timestamp changes. This
is all smoothly handled with replica listeners, and can be extended to swapping
out entire components on the fly by detaching replica listeners:

```js
const MessageMessageView {
    /**
     * @param {!Element} element
     * @param {!Message} message
     */
    constructor(element, message) {
        this.element = element;
        this.message = message;

        this.recreate();
    }

    recreate() {
        this.element.textContent = '';
        this.message.clearListeners();
        this.element.appendChild((() => {
            const res = document.createElement('input');
            res.type = 'text';
            this.message.addListenerAndInvoke('message', (message) => {
                res.value = message;
            });
            res.addEventListener('input', () => {
                this.message.set('message', res.value);
                this.message.set('lastEdited', new Date());
            });
            return res;
        })());
    }
}

class MessageTimestampsView {
    /**
     * @param {!Element} element
     * @param {!Message} message
     */
    constructor(element, message) {
        this.element = element;
        this.message = message;

        this.recreate();
    }

    recreate() {
        this.element.textContent = '';
        this.message.clearListeners();
        this.element.appendChild((() => {
            const res = document.createElement('ul');
            res.appendChild((() => {
                const res = document.createElement('li');
                this.message.addListenerAndInvoke('createdAt', (createdAt) => {
                    res.textContent = createdAt.toLocaleString();
                });
                return res;
            })());
            res.appendChild((() => {
                const res = document.createElement('li');
                this.message.addListenerAndInvoke('lastEdited', (lastEdited) => {
                    res.textContent = lastEdited.toLocaleString();
                });
                return res;
            })());
            return res;
        })());
    }
}

class MessageView {
    /**
     * @param {!Element} element
     * @param {!Message} message
     */
    constructor(element, message) {
        this.element = element;
        this.message = message;

        this._messageView = new MessageMessageView(document.createElement('div'), message.createReplica());
        this._timestampsView = new MessageTimestampsView(document.createElement('div'), message.createReplica());

        this.recreate();
    }

    recreate() {
        this.element.textContent = '';
        this.element.appendChild(this._messageView.element);
        this.element.appendChild(this._timestampsView.element);
    }
}
```

And with just this we have a message view which separates the concerns of
managing the message and the timestamps, yet the message is able to modify the
timestamps without either the parent nor the timestamps view having to know
specifically that the message view does that. Furthermore, each layer of the
component looks the same - they don't need to coordinate their listeners with
each other, as their listeners are all attached to a different replica, and
hence can be cleared without affecting the others.

Notice how there was no painful function passing in this example as you would
typically see in a top-down architecture like react, and the DOM changes are
as small as is possible (when the time stamp changes, the only thing that
updates is the text content of the corresponding element).
