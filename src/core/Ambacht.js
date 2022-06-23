import {
  css as LitCSS,
  ref as LitRef,
  createRef as LitCreateRef,
  html as LitHTML,
  LitElement,
  until as LitUntil,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/all/lit-all.min.js';

import 'https://cdn.jsdelivr.net/npm/tabbable@5.2.1/dist/index.umd.min.js';
import 'https://cdn.jsdelivr.net/npm/focus-trap@6.7.3/dist/focus-trap.umd.min.js';

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

    // Stores the timeout handler for the current instance to prevent
    // function handlers are not used multiple times.
    this.throttleHandler;
    this.throttle = throttle || 1000 / 60;

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

    if (!disableFocusTrap) {
      this.focusContext = createRef();
    }

    /**
     * Constructs the global Ambacht context to enable communication within the
     * window context.
     */
    if (this.root && false === this.root.Ambacht instanceof Object) {
      this.log(`Ambacht global enabled for ${this.name}`);

      this.root.Ambacht = {
        currentElements: [],
      };
    }
  }

  static _attributeNameForProperty(name, options) {
    return super._attributeNameForProperty(
      name.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase(),
      {}
    );
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
   * The global click handler that is implemented within the document context.
   *
   * @param {Event.target} target Should contain the Event target value.
   */
  _globalClickFunction({ target }) {
    this._handleCurrentElement(target);
  }

  /**
   * The global focus handler that is implemented within the document context.
   *
   * @param {Event.target} target Should contain the Event target value.
   */
  _globalFocusFunction({ target }) {
    this._handleCurrentElement(target);
  }

  /**
   * The global keydown handler that is implemented within the document context.
   *
   * @param {Event.target} keyCode Should contain the Keyboard Event keyCode
   * value.
   */
  _globalKeyDownFunction({ keyCode, target }) {
    if (keyCode === 27) {
      this._update('currentElement', false);

      if (target === this || this.contains(target)) {
        target.blur();
      }
    }
  }

  /**
   * Event Wrapper that should implement the inheritet event handler as a\
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
    // Catch the initial click event and invoke any additional properties
    // for the custom element.
    event.stopImmediatePropagation();

    // Prevents any interaction during a request or if the element is disabled.
    if (this.preventEvent) {
      return;
    }

    // Use the defined handler as function otherwise invoke the original
    // Event Handler.
    if (typeof handler === 'function') {
      return handler();
    } else {
      if (event.target && event.target !== this) {
        event.target.dispatchEvent(new Event(handler || event.type));
      } else if (context !== this) {
        context.dispatchEvent(new Event(handler || event.type));
      } else {
        this.dispatchEvent(new Event(handler || event.type));
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
   * Renders the actual icon as inline or external icon. And inline SVG element
   * will be used when the iconName property is defined.
   */
  _renderImage(name, classname) {
    return this._testImage(false, name)
      ? html`
          <svg class="${classname}" aria-hidden="true" focusable="false">
            <use xlink:href="${this.spriteSource}#${name}"></use>
          </svg>
        `
      : html`
          <img
            class="${classname}"
            aria-hidden="true"
            focusable="false"
            src="${this._testImageSource(name) ? name : this.spriteSource}"
          />
        `;
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
   * Throttles the defined handler to prevent multiple handlers from being
   * fired.
   *
   * @param {Function} handler The function handler that should be throttled.
   */
  _throttle(handler) {
    if (this.throttle) {
      clearTimeout(this.throttle);
    }

    this.throttleHandler = setTimeout(handler, this.throttle);
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
   * Should return the root container element or the Shadow Dom instance.
   */
  _context() {
    return this.context && this.context.value ? this.context.value : this;
  }

  /**
   * Assigns the global Event listeners to include property helper within the
   * custom element.
   */
  connectedCallback() {
    console.log('ambacht');

    try {
      // Marks the custom element as currentElement that should extend the
      // elements funcionality.
      this._clickHandler = document.addEventListener('click', this._globalClickFunction.bind(this));

      // Removes the currentElement flag during certain keypress Events.
      this._keyDownHandler = document.addEventListener(
        'keydown',
        this._globalKeyDownFunction.bind(this)
      );

      // Marks the custom element as currentElement that should extend the
      // elements funcionality.
      this._focusHandler = document.addEventListener(
        'focus',
        this._globalFocusFunction.bind(this),
        true
      );
    } catch (exception) {
      console.error(exception);
    }

    super.connectedCallback();
  }

  /**
   * Cleans up the DOM by removing the constructed instance Events.
   */
  disconnectedCallback() {
    try {
      document.removeEventListener('click', this._globalClickFunction);
      document.removeEventListener('focus', this._globalFocusFunction);
      document.removeEventListener('keydown', this._globalKeyDownFunction);

      delete this._clickHandler;
      delete this._focusHandler;
      delete this._keyDownHandler;

      if (this.throttle) {
        clearTimeout(this.throttle);
      }
    } catch (exception) {
      console.error(exception);
    }

    super.disconnectedCallback();
  }

  /**
   * Implements the required component dependencies like Focus Trap.
   */
  firstUpdated() {
    console.log(this, this.focusContext.value);

    if (!this.focusTrap && this.focusContext && this.focusContext.value) {
      this.focusTrap = focusTrap.createFocusTrap([this, this.focusContext.value], {
        escapeDeactivates: true,
        allowOutsideClick: true,
      });

      this.log(`Focus Trap instance created for ${this.name}`);
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

  /**
   * Alias function to activate the created § Trap instance.
   */
  lockFocus() {
    if (!this.focusTrap) {
      return;
    }

    if (this.focusTrap.activate && this.focusContext && this.focusContext.value) {
      this.focusTrap.activate();

      this.log(`Focus locked within: ${this.name}`);
    }
  }

  /**
   * Alias function to deactivate the created Focus Trap instance.
   */
  unlockFocus() {
    if (!this.focusTrap) {
      return;
    }

    if (this.focusTrap.activate && this.focusContext && this.focusContext.value) {
      this.focusTrap.deactivate();

      console.log(this.focusContext.value);

      this.log(`Focus unlocked within: ${this.name}`);
    }
  }

  /**
   * Alias function for the console method.
   *
   * @param {String} message The message to output.
   * @param {String} type Should use an existing console method
   */
  log(message, type) {
    if (typeof console[type || 'log'] === 'function') {
      console[type || 'log'](Array.isArray(message) ? [...message] : message);
    }
  }
}
