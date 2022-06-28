import {
  css as LitCSS,
  ref as LitRef,
  createRef as LitCreateRef,
  html as LitHTML,
  LitElement,
  until as LitUntil,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/all/lit-all.min.js';

import 'https://cdn.jsdelivr.net/npm/tabbable@5.3.3/dist/index.umd.min.js';
import 'https://cdn.jsdelivr.net/npm/focus-trap@6.9.4/dist/focus-trap.umd.min.js';

import defaultStyles from './defaults.css.asset.js';

export const createRef = LitCreateRef;
export const css = LitCSS;
export const html = LitHTML;
export const ref = LitRef;
export const until = LitUntil;

export class AmbachtElement extends LitElement {
  constructor(props) {
    super();

    const { name, throttle, disableFocusTrap } = props || {};

    // Should define the base classname for the Custom Element.
    this.name = name || this.constructor.name;

    // Flag that will block the fired Event Handler.
    this.preventEvent = false;

    // Implements support for the inline svg sprite from a single source.
    this.spriteSource = '';

    // Implements the focus Trap module to maintain the focus context within
    // the module when required.
    this.disableFocusTrap = disableFocusTrap || false;
    this.hasFocusTrap = false;

    // Stores the timeout handler for the current instance to prevent
    // function handlers are not used multiple times.
    this.throttleHandler;
    this.throttleDelay = isNaN(parseFloat(throttle)) ? 1000 / 60 : throttle;

    // Contains the keycodes that should be ignored during a Keyboard Event.
    this.ignoredKeyCodes = [9, 16, 17, 18, 20];

    // Contains the keycodes that should abort the initial functionality for the
    // component.
    this.exitKeyCodes = [27];

    // Defines the support images extensions that could be used during the
    // _renderImage helper.
    this.supportedImageExtensions = [
      '.apng',
      '.avif',
      '.bmp',
      '.gif',
      '.jpeg',
      '.jpg',
      '.png',
      '.svg',
      '.tiff',
      '.webp',
    ];

    this.root = window;

    this.context = createRef();

    if (!this.disableFocusTrap) {
      this.focusContext = createRef();
    }

    // Constructs the global Ambacht context to enable communication within the
    // window context.
    if (this.root && false === this.root.Ambacht instanceof Object) {
      this.log(`Initial Ambacht global enabled from ${this.name}`);

      this.root.Ambacht = {
        currentElements: [],
      };
    }

    // Stores the document Event handlers that where assigned for this
    // component.
    this.globalEvents = [];
  }

  static get properties() {
    return {
      name: {
        type: String,
      },
      preventEvent: {
        type: Boolean,
      },
      spriteSource: {
        type: String,
      },
      disableFocusTrap: {
        type: Boolean,
      },
    };
  }

  static get styles() {
    return css`
      ${defaultStyles}
    `;
  }

  /**
   * Ensures the given string is formatted as correct HTML attribute.
   * @param {String} name
   * @param {} options
   * @returns
   */
  static _attributeNameForProperty(name, options) {
    return super._attributeNameForProperty(
      name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase(),
      {}
    );
  }

  /**
   * Should return the root container element or the Shadow Dom instance.
   */
  _context() {
    return this.context && this.context.value ? this.context.value : this;
  }

  /**
   * Implements function handling from the window scope that are outside a
   * Framework scope.
   *
   * @param {Function|String} handler Handles the function directly or call the
   * assigned function from the window context.
   */
  _fn(handler) {
    if (typeof handler === 'function') {
      return handler;
    } else if (typeof this.root[handler] === 'function') {
      return this.root[handler];
    }
  }

  /**
   * The global click handler that is implemented within the document context.
   *
   * @param {Event.target} target Should contain the Event target value.
   */
  _documentClickFunction({ target }) {
    this._handleCurrentElement(target);
  }

  /**
   * The global focus handler that is implemented within the document context.
   *
   * @param {Event.target} target Should contain the Event target value.
   */
  _documentFocusFunction({ target }) {
    this._handleCurrentElement(target);
  }

  /**
   * The global keydown handler that is implemented within the document context.
   *
   * @param {Event.target} keyCode Should contain the Keyboard Event keyCode
   * value.
   */
  _documentKeyDownFunction({ keyCode, target }) {
    if (keyCode === 27) {
      this._update('currentElement', false);

      if (target === this || this.contains(target)) {
        target.blur();
      }
    }
  }

  /**
   * Helper function that is assigned to the custom element Event Listeners.
   * It should enable the currentElement property.
   *
   * @param {HTMLElement} context Will mark the custom-element if the defined
   * context exists within the scope of the element instance.
   */
  _handleCurrentElement(context) {
    this._update('currentElement', () => {
      if (this._isComponentContext(context)) {
        this.currentElement = true;
      } else {
        this.currentElement = false;
      }
    });
  }

  /**
   * Event Wrapper that should implement the inherited event handler as a
   * property;
   *
   * @param {Event} event The inherited event from the dispatched Event.
   * @param {Element} context Triggers the defined Event to the selected
   * Element.
   * @param {Function|String} handler Optional callback handler to run after
   * the Event has been fired.
   * Should dispatch the handler as a new if the defined handler is a string.
   */
  _handleEvent(event, context, handler) {
    if (!handler) {
      return;
    }

    // Catch the initial click event and invoke any additional properties
    // for the custom element.
    if (event && event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }

    // Prevents any interaction during a request or if the element is disabled.
    if (this.preventEvent) {
      return;
    }

    // Use the defined handler as function otherwise invoke the original
    // Event Handler.
    try {
      if (typeof handler === 'function') {
        return handler(event, context);
      } else {
        if (event.target && event.target !== this) {
          event.target.dispatchEvent(new Event(handler || event.type));
        } else if (context !== this) {
          context.dispatchEvent(new Event(handler || event.type));
        } else {
          this.dispatchEvent(new Event(handler || event.type));
        }
      }
    } catch (exception) {
      this.log(exception, 'error');
    }
  }

  /**
   * Helper function that will check if the element exists within the referenced
   * context.
   *
   * @param {HTMLElement} element The element to check within the context.
   */

  _isComponentContext(element) {
    const { value } = this.context || {};

    return (
      element === value ||
      element === this ||
      (value && value.contains(element)) ||
      this.contains(element)
    );
  }

  /**
   * Helper function that updates an Element property that is defined within the
   * define function handler. A requestUpdate will be fired afterwards.
   *
   * @param {String} property The property to update
   * @param {Function} handler The function that should update the property.
   */
  _update(property, handler) {
    if (!property) {
      return;
    }

    try {
      const value = this[property];
      if (typeof handler === 'function') {
        handler();
      } else {
        this[property] = handler;
      }

      // Ensure the updated property is recognized by Lit.
      this.requestUpdate(property, value);
    } catch (exception) {
      console.error(exception);
    }
  }

  /**
   * Ensure the whitespace is removed from the defined value
   * @param {*} value
   * @returns
   */
  _strip(value) {
    return value
      ? value
          .split(' ')
          .join('')
          .replace(/\r?\n|\r/g, '')
      : null;
  }

  /**
   * Renders the actual icon as inline or external icon. And inline SVG element
   * will be used when the iconName property is defined.
   * @param {String} name Defines the image source or sprite name from the given
   * parameter.
   * @param {String} classname Includes the optional classname to the image
   * element.
   */
  _renderImage(name, classname) {
    return this._testImage(false, name)
      ? html`
          <svg class="${classname || ''}" aria-hidden="true" focusable="false">
            <use xlink:href="${this.spriteSource}#${name}"></use>
          </svg>
        `
      : html`
          <img
            class="${classname || ''}"
            aria-hidden="true"
            focusable="false"
            src="${this._testImageSource(name) ? name : this.spriteSource}"
          />
        `;
  }

  /**
   * Check if the required icon properties are defined for an inline or
   * external icon.
   *
   * @param {Boolean} initial Will pass the statement if the iconSource is
   * defined.
   *
   * @param {String} context The context that will test the existance of the
   * image.
   */
  _testImage(initial, context) {
    if (
      !this.spriteSource ||
      !this._testImageSource(this.spriteSource) ||
      this._testImageSource(context)
    ) {
      return false;
    }

    if (initial && this.spriteSource) {
      if (context && this._testImageSource(this.spriteSource) && this._testImageSource(context)) {
        return false;
      }

      return true;
    } else if (initial) {
      return false;
    }

    if (this.spriteSource && context) {
      if (
        this._testImageSource(this.spriteSource) &&
        this._testImageSource(context.replace(/\r?\n|\r/g, ''))
      ) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Test if the defined source is a valid image extension.
   *
   * @param {String} source The path that will be checked.
   */
  _testImageSource(source) {
    if (typeof source !== 'string') {
      return;
    }

    let image = false;

    this.supportedImageExtensions.forEach((ext) => {
      if (source.replace(/\r?\n|\r/g, '').endsWith(ext)) {
        image = true;
      }
    });

    return image;
  }

  /**
   * Throttles the defined handler to prevent multiple handlers from being
   * fired.
   *
   * @param {Function} handler The function handler that should be throttled.
   * @param {Number} timeout Optional timeout that will be used instead of
   * this.throttleDelay.
   */
  _throttle(handler, timeout) {
    if (this.throttleHandler) {
      clearTimeout(this.throttleHandler);
    }

    this.throttleHandler = setTimeout(handler, timeout != null ? timeout : this.throttleDelay);
  }

  /**
   * Assigns the global Event listeners to include property helper within the
   * custom element.
   */
  connectedCallback() {
    try {
      // Marks the custom element as currentElement that should extend the
      // elements funcionality.
      this.subscribeGlobalEvent('click', this._documentClickFunction);

      // Removes the currentElement flag during certain keypress Events.
      this.subscribeGlobalEvent('keydown', this._documentKeyDownFunction);

      // Marks the custom element as currentElement that should extend the
      // elements funcionality.
      this.subscribeGlobalEvent('focus', this._documentFocusFunction);
    } catch (exception) {
      console.error(exception);
    }

    super.connectedCallback();
  }

  /**
   * Check if the defined function handler has been defined.
   *
   * @param {Event.tyoe} type The Event type that will be matched.
   * @param {Function} handler The Function handler that will be matched.
   *
   * @returns {Boolean|null} Should return the matched subscription.
   */
  _filterDocumentEvent(type, handler) {
    if (!this.globalEvents.length) {
      return;
    }

    const entry = [];
    this.globalEvents.forEach(([t, h, ctx], i) => {
      if (t === type && h.name === handler.name) {
        entry.push([t, h, ctx, i]);
      }
    });

    if (!entry.length) {
      return;
    }

    return entry[0];
  }

  /**
   * Subscribes a new Document Event listener to this.globalEvents.
   * This method ensures that global Event listeners are assigned to the
   * component so it can be cleaned up correctly.
   *
   * @param {Event.type} type The event type to subscribe.
   * @param {Function} handler The function handler that will be called.
   * @param {EventTarget} context Assigns the Event to the given context,
   * Document will be used as fallback.
   */
  subscribeGlobalEvent(type, handler, context) {
    if (!type) {
      this.log(`Unable to subscribe unnamed Document Event.`, 'error');
      return;
    }

    if (typeof handler !== 'function') {
      this.log(
        `Unable to subscribe new Document Event, no valid function handler has been defined`,
        'error'
      );
      return;
    }

    if (this._filterDocumentEvent(type, handler)) {
      this.log(`Unable to subscribe already subscribe Document Event for ${type}`);
      return;
    }

    // Create a new Function scope for the defined handler so it can be
    // correctly stored and removed for the Document.
    const fn = handler.bind(this);

    const ctx = context || document;

    this.globalEvents.push([type, fn, ctx]);

    ctx.addEventListener(type, fn);

    this.log(`Document Event subscribed for: ${type}`);
  }

  /**
   * Removes a subscribe Document Event for this component.
   *
   * @param {Event.Type} type The Event type that was assigned as Document Event.
   * @param {Function} handler The function handler that should match with one
   * of the subscribed Events.
   */
  unsubscribeGlobalEvent(type, handler) {
    if (!type) {
      this.log(`Unable to unsubscribe unnamed Document Event.`, 'error');
      return;
    }

    if (typeof handler !== 'function') {
      this.log(
        `Unable unsubscribe new Document Event, no valid function handler has been defined`,
        'error'
      );
      return;
    }

    const subscribtion = this._filterDocumentEvent(type, handler.bind(this));

    if (!subscribtion) {
      this.log(`Unable to unsubscribe non existing Document Event for ${type}`);
      return;
    }

    const [t, h, ctx, i] = subscribtion;

    if (!t || !h || !ctx) {
      this.log(`Unable to remove event for ${type}, since it was originally not subscribed`);
    }

    ctx.removeEventListener(t, h);

    // Remove the original Event subscribtion.
    this.globalEvents = this.globalEvents.filter((e, index) => index !== i);

    this.log(`Document Event removed for: ${type}`);
  }

  /**
   * Implements the mandatory cleanup tasks for the defined component.
   */
  disconnectedCallback() {
    try {
      this.unsubscribeGlobalEvent('click', this._documentClickFunction);
      this.unsubscribeGlobalEvent('keydown', this._documentKeyDownFunction);
      this.unsubscribeGlobalEvent('focus', this._documentFocusFunction);

      if (this.throttleHandler) {
        clearTimeout(this.throttleHandler);
      }

      super.disconnectedCallback();
    } catch (exception) {
      this.log(exception, 'error');
    }
  }

  /**
   * Implements the required component dependencies like Focus Trap.
   */
  firstUpdated() {
    if (!this.focusTrap && this.focusContext && this.focusContext.value) {
      this._throttle(() => {
        this.focusTrap = focusTrap.createFocusTrap([this, this.focusContext.value], {
          escapeDeactivates: true,
          allowOutsideClick: true,
          tabbableOptions: {
            getShadowRoot: (elements) => {
              if (this._isComponentContext(elements)) {
                return elements;
              }
            },
          },
        });
        this.log(`Focus Trap instance created for ${this.name}`);
      });
    }
  }

  /**
   * Alias function to activate the created § Trap instance.
   */
  lockFocus() {
    if (!this.focusTrap) {
      return;
    }

    if (
      !this.hasFocusTrap &&
      this.focusTrap.activate &&
      this.focusContext &&
      this.focusContext.value
    ) {
      try {
        this._throttle(() => {
          this.log(`Focus locked within: ${this.name}`);
          this.focusTrap.activate();
          this._update('hasFocusTrap', true);
        });
      } catch (exception) {
        this.log(exception, 'error');
      }
    }
  }

  /**
   * Alias function for the console method.
   *
   * @param {String} message The message to output.
   * @param {Console} type Should use an existing console method
   */
  log(message, type) {
    if (typeof console[type || 'log'] === 'function') {
      let output = message;
      if (!Array.isArray(output)) {
        output = [output];
      }

      if (this.root && this.root.Ambacht && this.root.Ambacht.verbose) {
        output.forEach((m) => console[type || 'log'](m));
      }
    }
  }

  /**
   * Alias function to deactivate the created Focus Trap instance.
   */
  unlockFocus() {
    if (!this.focusTrap) {
      return;
    }

    if (
      this.hasFocusTrap &&
      this.focusTrap.deactivate &&
      this.focusContext &&
      this.focusContext.value
    ) {
      try {
        this.log(`Focus locked within: ${this.name}`);
        this.focusTrap.deactivate();
        this._update('hasFocusTrap', false);
      } catch (exception) {
        this.log(exception, 'error');
      }
    }
  }

  /**
   * Updates the global Ambacht context during a component update.
   */
  updated() {
    if (this.currentElement) {
      this.root.Ambacht.currentElements.push(this);
    } else {
      this.root.Ambacht.currentElements = this.root.Ambacht.currentElements.filter(
        (c) => c !== this
      );
    }

    super.updated();
  }
}
