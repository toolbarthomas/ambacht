import {
  css as LitCSS,
  html as LitHTML,
  LitElement,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/all/lit-all.min.js';

export const css = LitCSS;
export const html = LitHTML;

/**
 * Implements LitElement interface with additional features for setting up
 * Ambacht component more easily.
 */
export class AmbachtElement extends LitElement {
  constructor(props) {
    super();

    const { name, delay } = props;

    // Should define the base classname for the Custom Element.
    this.name = name || this.constructor.name;

    // Flag that will block the fired Event Handler.
    this.preventEvent = false;

    // Implements support for the inline svg sprite from a single source.
    this.spriteSource = '';

    // Stores the timeout handler for the current instance to prevent
    // function handlers are not used multiple times.
    this.throttle;
    this.throttleDelay = delay || 300;

    // Contains the keycodes that should be ignored during a Keyboard Event.
    this.ignoredKeyCodes = [9, 16, 17, 18, 20];

    // Marks the custom element as currentElement that should extend the
    // elements funcionality.
    this.clickHandler = document.addEventListener('click', ({ target }) => {
      this._handleCurrentElement(target);
    });

    // Removes the currentElement flag during certain keypress Events.
    this.clickHandler = document.addEventListener('keydown', ({ keyCode }) => {
      if (keyCode === 27) {
        this._update('currentElement', () => {
          this.currentElement = false;
        });
      }
    });

    // Marks the custom element as currentElement that should extend the
    // elements funcionality.
    this.focusHandler = document.addEventListener(
      'focus',
      ({ target }) => {
        this._handleCurrentElement(target);
      },
      true
    );

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
    };
  }

  /**
   * Event Wrapper that should implement the inheritet event handler as a\
   * property;
   *
   * @param {Event} event The inherited event from the dispatched Event.
   * @param {Function|String} handler Optional callback handler to run after the Event
   * has been fired. Should dispatch the handler as a new if the defined handler is a string.
   */
  _handleEvent(event, handler) {
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
      if (event.path && event.path[0] !== this) {
        event.path[0].dispatchEvent(new Event(handler || event.type));
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
      if (context === this || this.contains(context)) {
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

      this.requestUpdate(property, value);
    } catch (exception) {
      console.error(exception);
    }
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
    } else if (typeof window[handler] === 'function') {
      return window[handler];
    }
  }

  /**
   * Renders the actual icon as inline or external icon. And inline SVG element
   * will be used when the iconName property is defined.
   */
  _renderImage(name, classname) {
    console.log(this._testImageSource(name), name);

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

    this.throttle = setTimeout(handler, this.throttleDelay);
  }
}
