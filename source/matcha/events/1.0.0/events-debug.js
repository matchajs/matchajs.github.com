/**
 * Thanks:
 * - https://github.com/documentcloud/backbone/blob/master/backbone.js
 * 
 * Events
 * @author kidney<kidneyleung@gmail.com>
 * 
 */
define("matcha/events/1.0.0/events-debug", [], function(require, exports, module) {

var objectKeys = Object.keys;
if (!objectKeys) {
    objectKeys = function(obj) {
        var result = [], name;
        for (name in obj) {
            obj.hasOwnProperty(name) && result.push(name);
        }
        
        return result;
    };
}


// Regular expression used to split event strings
var eventSplitter = /\s+/;

/**
 * A module that can be mixed in to *any object* in order to provide it with
 * custom events. You may bind with `on` or remove with `off` callback functions
 * to an event; `trigger`-ing an event fires all callbacks in succession.
 * 
 * var object = new Events();
 * object.on('expand', function(){ alert('expanded'); });
 * object.trigger('expand');
 * 
 */
function Events() {
}

// Bind one or more space separated events, `events`, to a `callback`
// function. Passing `"all"` will bind the callback to all events fired.
Events.prototype.on = function(events, callback, context) {
    var self = this,
        calls, event, list;
        
    if (!callback) return self;

    events = events.split(eventSplitter);
    calls = self._callbacks || (self._callbacks = {});

    while (event = events.shift()) {
        list = calls[event] || (calls[event] = []);
        list.push(callback, context);
    }

    return self;
};

// Remove one or many callbacks. If `context` is null, removes all callbacks
// with that function. If `callback` is null, removes all callbacks for the
// event. If `events` is null, removes all bound callbacks for all events.
Events.prototype.off = function(events, callback, context) {
    var self = this,
        event, calls, list, i;
    
    // No events, or removing *all* events.
    if (!(calls = self._callbacks)) return self;
    
    if (!(events || callback || context)) {
        delete self._callbacks;
        return self;
    }

    events = events ? events.split(eventSplitter) : objectKeys(calls);

    // Loop through the callback list, splicing where appropriate.
    while (event = events.shift()) {
        if (!(list = calls[event]) || !(callback || context)) {
            delete calls[event];
            continue;
        }

        for (i = list.length - 2; i >= 0; i -= 2) {
            if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                list.splice(i, 2);
            }
        }
    }

    return self;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.prototype.trigger = function(events) {
    var self = this,
        event, calls, list, i, length, args, all, rest;
    
    if (!(calls = self._callbacks)) return self;

    rest = [];
    events = events.split(eventSplitter);

    // Fill up `rest` with the callback arguments.  Since we're only copying
    // the tail of `arguments`, a loop is much faster than Array#slice.
    for (i = 1, length = arguments.length; i < length; i++) {
        rest[i - 1] = arguments[i];
    }

    // For each event, walk through the list of callbacks twice, first to
    // trigger the event, then to trigger any `"all"` callbacks.
    while (event = events.shift()) {
        // Copy callback lists to prevent modification.
        if (all = calls.all) all = all.slice();
        if (list = calls[event]) list = list.slice();
        
        // Execute event callbacks.
        if (list) {
            for (i = 0, length = list.length; i < length; i += 2) {
                list[i].apply(list[i + 1] || self, rest);
            }
        }
        
        // Execute "all" callbacks.
        if (all) {
            args = [event].concat(rest);
            for (i = 0, length = all.length; i < length; i += 2) {
                all[i].apply(all[i + 1] || self, args);
            }
        }
    }

    return self;
};

return Events;
});