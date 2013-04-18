// Class Models
//
// @author kidney<kidneyleung@gmail.com>
//
// thansks:
// - http://mootools.net/docs/core/Class/Class
// - http://ejohn.org/blog/simple-javascript-inheritance/
// - https://github.com/aralejs/class
// - http://uxebu.com/blog/2011/02/23/object-based-inheritance-for-ecmascript-5/
define("matcha/class/1.0.0/class-debug", [], function(require, exports, module) {
    "use strict";

    // Helpers
    var coreToString = Object.prototype.toString,

        isArray = Array.isArray || function(obj) {
            return coreToString.call(obj) == '[object Array]';
        },

        // see: http://jsperf.com/array-indexof-speed-test/2
        indexOf = Array.prototype.indexOf ?
            function(arr, item) {
                return arr.indexOf(item);
            } : function(arr, item) {
                var len = arr.length;
                while(len--) {
                    if (arr[len] === item) {
                        return len;
                    }
                }
                return -1;
            },

        createProto = Object.__proto__ ?
            function(proto) {
                return {__proto__: proto};
            } : function(proto) {
                var klass = function() {};
                klass.prototype = proto;
                return new klass();
            };

    function isFunction(obj) {
        return coreToString.call(obj) === '[object Function]';
    }

    function mix(target, source, filterList) {
        // Copy "all" properties including inherited ones.
        var item;
        for (item in source) {
            if (!source.hasOwnProperty(item) ||
                item === 'prototype' || // prototype will be enumerated on iPhone1 Safari, we should be excluded
                (filterList && indexOf(filterList, item) !== -1)) {
                continue;
            }

            target[item] = source[item];
        }
    }

    function implement(prop) {
        var self = this,
            clsMutators = Class.Mutators,
            parentExisted = self.parent,
            name, val;

        for (name in prop) {
            val = prop[name];

            if (clsMutators.hasOwnProperty(name)) {
                clsMutators[name].call(self, val);
            } else {
                self.prototype[name] = (isFunction(val) && isFunction(parentExisted[name])) ? wrap(self, name, val) : val;
            }
        }
        return self;
    }

    function wrap(self, name, method) {
        return function(){
            var thisFn = this,
                tmp = thisFn.parent,
                parent = self.parent,
                result;

            thisFn.parent = (parent) ? parent[name] : null;

            result = method.apply(thisFn, arguments);

            thisFn.parent = tmp;

            return result;
        };
    }

    // The base Class implementation (does nothing)
    var Class = function() {};

    // Create a new Class that inherits from this class
    Class.create = function(parent, prop) {
        if (!isFunction(parent)) {
            prop = parent;
            parent = null;
        }

        prop = isFunction(prop) ? {init: prop} : (prop || {});

        if (!parent && prop.Extends) {
            parent = prop.Extends;
        }
        parent = parent || Class;

        // Instantiate a base class
        var parentExisted = parent.prototype,
            parentProto = createProto(parentExisted);

        // created class constructor
        var newClass = function() {
            var self = this;

            return (self.init) ? self.init.apply(self, arguments) : self;
        };

        // Set a convenience property in case the parent's prototype is
        // needed later.
        newClass.parent = parentExisted;

        // Populate our constructed prototype object
        newClass.prototype = parentProto;

        implement.call(newClass, prop);

        // Enforce the constructor to be what we expect
        newClass.prototype.constructor = newClass;

        // Ensure this class parent property is parent's prototype
        newClass.parent = parentExisted;

        // And make this class extendable
        newClass.extend = function(prop) {
            return Class.create(this, prop);
        };

        newClass.implement = implement;

        return newClass;
    };

    Class.Mutators = {
        /**
         * Extends is an empty function by default
         * @constructor
         */
        Extends: function(){},

        /**
         * Copy the properties over onto the this class's prototype
         * @param items
         */
        Implements: function(items) {
            items = isArray(items) ? items : [items];

            var proto = this.prototype, item;
            while (item = items.shift()) {
                mix(proto, item.prototype || item);
            }
        },

        /**
         * add private property
         * @param staticProperty
         */
        Statics: function(staticProperty) {
            mix(this, staticProperty, ['parent']);
        }
    };

    module.exports = Class;
});