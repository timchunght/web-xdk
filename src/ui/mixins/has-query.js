/**
 * A Mixin for main components that can receive or generate a Query.
 *
 * @class Layer.UI.mixins.HasQuery
 * @ismixin
 */
import { client as Client } from '../../settings';
import Core from '../../core/namespace';
import mixins from './index';

mixins.HasQuery = module.exports = {
  properties: {

    /**
     * The ID for the Layer.Core.Query providing the items to render.
     *
     * Note that you can directly set the {@link #query} property as well.
     *
     * Leaving this and the query properties empty will cause a Layer.Core.Query to be generated for you.
     *
     * @property {String} [queryId='']
     */
    queryId: {
      set(value) {
        if (value && value.indexOf('layer:///') !== 0) this.properties.queryId = '';
        this.query = this.queryId ? Client.getQuery(this.queryId) : null;
      },
    },

    /**
     * A Layer.Core.Query provides the items to render.
     *
     * Suggested practices:
     *
     * * If your not using this query elsewhere in your app, let this widget generate its own Query
     * * If setting this from an html template, use {@link #queryId} instead.
     *
     * @property {Layer.Core.Query} [query=null]
     */
    query: {
      set(newValue, oldValue) {
        if (oldValue) oldValue.off(null, null, this);
        if (newValue instanceof Core.Query) {
          this._updateQuery();
        } else {
          this.properties.query = null;
        }

        // If there is an oldQuery that we didn't generate, its up to the app to destroy it when it is done.
        // Otherwise, if we have a generated query, that was the `oldValue` and can now be destroyed
        if (this.hasGeneratedQuery) {
          this.hasGeneratedQuery = false;
          oldValue.destroy();
        }
      },
    },

    /**
     * Set a filter on the Query.
     *
     * See {@link Layer.Core.Query#filter}.  This removes the data entirely from the Query.
     * Use it for removing items that are non-renderable or should not be rendered.
     *
     * ```
     * widget.queryFilter = function(item) {
     *     return isItemInteresting(item); // Only show items that return `true`
     * };
     * ```
     *
     * @property {Function} queryFilter
     * @property {Layer.Core.Root} queryFilter.item
     * @property {Boolean} queryFilter.return
     */
    queryFilter: {
      set() {
        if (this.query) this.query.filter = this.properties.queryFilter;
      },
    },

    /**
     * The Query was generated internally, not passed in as an attribute or property.
     *
     * @property {Boolean} [hasGeneratedQuery=false]
     * @readonly
     */
    hasGeneratedQuery: {
      value: false,
      type: Boolean,
    },

    /**
     * Does this widget generate its own query or should that behavior be prevented?
     *
     * If your providing your own Query, its a good practice to insure that a Query is NOT generated by the widget
     * as that Query will promptly fire, and consume your user's bandwidth:
     *
     * ```
     * var widget = document.createElement('some-widget');
     * widget.useGenerated = false;
     * ```
     *
     * This is only used if the Layer.UI.mixins.MainComponent mixin is part of this Component.
     *
     * @property {Boolean} [useGeneratedQuery=true]
     */
    useGeneratedQuery: {
      value: true,
      type: Boolean,
    },

    /**
     * How many items to page in each time we page the Query.
     *
     * @property {Number} [pageSize=50]
     */
    pageSize: {
      value: 50,
    },
  },
  methods: {
    // Lifecycle method; this depends upon the `client` property so waits for `onAfterCreate`
    onAfterCreate() {
      if (this.useGeneratedQuery) this._setupGeneratedQuery();
    },

    /**
     * A Component typically expects a Query as an input... or it needs to create its own.
     *
     * This method tests to see if it expects or has a Query, and creates one if needed.
     *
     * @method _setupGeneratedQuery
     * @private
     */
    _setupGeneratedQuery() {
      // Warning: Do not call the query getter via `this.query` as it may cause an infinite loop
      if (this._queryModel && !this.properties.query && Client && !Client.isDestroyed) {
        this.query = Client.createQuery({
          model: this._queryModel,
          dataType: Core.Query.InstanceDataType,
          paginationWindow: this.pageSize || 50,
          sortBy: this.sortBy,
        });
        if (this.properties.queryFilter) this.query.filter = this.properties.queryFilter;
        this.hasGeneratedQuery = true;
      }
    },

    /**
     * Any time we get a new Query assigned, wire it up.
     *
     * @method _updateQuery
     * @private
     */
    _updateQuery() {
      this.onRender();
      this.query.on('change', this.onRerender, this);
    },
  },
};
