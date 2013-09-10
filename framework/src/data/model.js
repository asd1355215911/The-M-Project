
M.Model = Backbone.Model.extend(M.Object);

M.Model.create = M.create;

_.extend(M.Model.prototype, {

    _type: 'M.Model',

    isModel: YES,

    entity: null,

    changedSinceSync: {},

    initialize: function(attributes, options) {
         options = options || {};

        this.idAttribute = options.idAttribute || this.idAttribute;
        this.store = this.store || (this.collection ? this.collection.store : null) || options.store;
        if (this.store && _.isFunction(this.store.initModel)) {
            this.store.initModel(this, options);
        }
        this.entity = this.entity || (this.collection ? this.collection.entity : null) || options.entity;
        if (this.entity) {
            this.entity = M.Entity.from(this.entity, { typeMapping: options.typeMapping });
            this.idAttribute = this.entity.idAttribute || this.idAttribute;
        }
        this.credentials = this.credentials || (this.collection ? this.collection.credentials : null) || options.credentials;
        this.on('change', this.onChange, this);
        this.on('sync',   this.onSync, this);
    },

    sync: function(method, model, options) {
        var store = (options ? options.store : null) || this.store;
        if (store && _.isFunction(store.sync)) {
            return store.sync.apply(this, arguments);
        } else {
            if (options && this.credentials) {
                var credentials = this.credentials;
                options.beforeSend = function(xhr) {
                    M.Request.setAuthentication(xhr, credentials);
                }
            }
            return Backbone.sync.apply(this, arguments);
        }
    },

    onChange: function(model, options) {
    // For each `set` attribute, update or delete the current value.
        var attrs = model.changedAttributes();
        if ( _.isObject(attrs)) {
            for (attr in attrs) {
                val = attrs[attr];
                this.changedSinceSync[attr] = val;
            }
        }
    },

    onSync: function(model, options) {
        this.changedSinceSync = {};
    }
});
