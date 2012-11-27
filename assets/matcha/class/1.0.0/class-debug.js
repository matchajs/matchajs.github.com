/**
 *
 * Class Models
 *
 * thansks:
 *  - http://mootools.net/docs/core/Class/Class
 *  - http://ejohn.org/blog/simple-javascript-inheritance/
 *  - https://github.com/aralejs/class
 *  - http://uxebu.com/blog/2011/02/23/object-based-inheritance-for-ecmascript-5/
 *
 * @author kidney<kidneyleung@gmail.com>
 * 
 */
define("matcha/class/1.0.0/class-debug", [], function(require, exports, module) {
// Helper
var NULL = null,
    coreToString = Object.prototype.toString;

    function isArray(obj) {
        return Array.isArray ?  Array.isArray(obj) : coreToString.call(obj) === '[object Array]';
    }
    function isFunction(obj) {
        return coreToString.call(obj) === '[object Function]';
    }

    // see: http://jsperf.com/array-indexof-speed-test/2
    function indexOf(arr, item) {
        return Array.prototype.indexOf ? arr.indexOf(item) : (function(){
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] === item) {
                    return i;
                }
            }
            return -1;
        })();
    }

    function createProto(proto) {
        return Object.__proto__ ? {__proto__: proto} : (function(){
            function klass() {}
            klass.prototype = proto;
            return new klass();
        })();
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

            thisFn.parent = (parent) ? parent[name] : NULL;

            result = method.apply(thisFn, arguments);

            thisFn.parent = tmp;

            return result;
        };
    }

    // The base Class implementation (does nothing)
    function Class() {}

    // Create a new Class that inherits from this class
    Class.create = function(parent, prop) {
        if (!isFunction(parent)) {
            prop = parent;
            parent = NULL;
        }

        prop = isFunction(prop) ? {init:prop} : (prop || {});

        if (!parent && prop.Extends) {
            parent = prop.Extends;
        }
        parent = parent || Class;

        // Instantiate a base class
        var parentExisted = parent.prototype,
            parentProto = createProto(parentExisted);

        // created class constructor
        function newClass() {
            var self = this;
            return (self.init) ? self.init.apply(self, arguments) : self;
        }

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