import { AmbachtElement, css, createRef, html, ref } from '../../core/Ambacht.js';

// import 'https://cdn.jsdelivr.net/npm/tabbable@5.2.1/dist/index.umd.min.js';
// import 'https://cdn.jsdelivr.net/npm/focus-trap@6.7.3/dist/focus-trap.umd.min.js';

import 'https://cdn.jsdelivr.net/npm/@a11y/focus-trap@1.0.5/index.min.js';

import style from './global-search.css.asset.js';

export class GlobalSearch extends AmbachtElement {
  constructor() {
    super({
      name: 'global-search',
      delay: 100,
    });

    this.resetLabel = 'Clear';

    // The readable label for the submit button.
    this.submitLabel = 'Search';

    // Displays the label when no results have been defined.
    this.noResultsLabel = 'No results';

    // Won't render the anchor element if the result contain a valid link.
    this.excludeResultLink = false;

    // Stores the found results inherited from the element onSearch callback.
    this.results = [];

    // Enable an indicator when TRUE.
    this.pending = false;

    // Use the defined delay to throttle the keyDown handler.
    this.throttleDelay = 500;

    // Excludes the form element and use a div wrapper instead.
    this.excludeFormElement = false;

    // Should define the searchfield input element.
    this.inputElement = createRef();

    // Should define the main container for the global search container.
    this.mainElement = createRef();

    // Should define the the global search upper container.
    this.rootElement = createRef();

    // Prevents modifier classnames to be inserted after a render update.
    this.mutated = false;
  }

  static get properties() {
    return {
      disabled: {
        type: Boolean,
      },
      excludeFormElement: {
        type: Boolean,
      },
      onError: {},
      onRender: {},
      onSearch: {},
      onSelect: {},
      placeholder: {
        type: String,
      },
      noResultsLabel: {
        type: String,
      },
      submitLabel: {
        type: String,
      },
      excludeResultLink: {
        type: Boolean,
      },
      icon: {
        type: String,
      },
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        ${style}
      `,
    ];
  }

  /**
   * Alias function to output the disabled state for the input elements.
   */
  _defineDisabled() {
    return this.disabled || this.pending ? true : false;
  }

  /**
   * Defines the modifier classnames for the root element.
   */
  _defineModifiers() {
    const modifiers = [];

    if (this._strip(this.value)) {
      modifiers.push('global-search--has-value');
    }

    if (this.currentElement && this._strip(this.value)) {
      modifiers.push('global-search--is-active');

      if (!this.results.length && !this.pending && this.mutated) {
        modifiers.push('global-search--has-no-results');
        this.mutated = false;
      }
    }

    if (this.pending) {
      modifiers.push('global-search--is-pending');
    }

    return modifiers.join('\n');
  }

  /**
   * Ensures the global search input element is focused at the end of the field.
   */
  _focusInput() {
    if (this.inputElement && this.inputElement.value) {
      const val = this.inputElement.value.value;

      this.inputElement.value.focus();
      this.inputElement.value.setSelectionRange(val.length, val.length);
    }
  }

  /**
   * Returns the defined exception to the defined context.
   *
   * @param {String} exception The error exception
   */
  _handleError(exception) {
    const handler = this._fn(this.onError);

    if (typeof handler === 'function') {
      handler(exception);
    }
  }

  /**
   * Returns the defined exception to the defined context.
   *
   * @param {String} exception The error exception
   */
  _handleRender() {
    const handler = this._fn(this.onRender);

    if (typeof handler === 'function') {
      const { value, results } = this;

      handler({
        value,
        results,
      });
    }
  }

  /**
   * Catches the default submit handler if there is no action defined for the
   * actual search element.
   *
   * @param {Event} event The inherited submit event handler.
   */
  _handleFormSubmit(event) {
    if (this.action) {
      return;
    }

    event.preventDefault();

    this._handleInputChange(event, true);
  }

  /**
   * Defines the click handler for the search button.
   *
   * @param {Event} event The inherited click event handler.
   */
  _handleButtonClick(event) {
    if (this.excludeFormElement) {
      event.preventDefault();
    }

    this._handleInputChange(event, true);
  }

  /**
   *
   * @param {*} event
   * @param {*} enforce
   * @returns
   */
  _handleReset(event) {
    if (this.inputElement.value) {
      this.inputElement.value.value = '';
      this._handleInputChange(event, true);
    }
  }

  /**
   * Implements the onSearch property handler during a form element change.
   *
   * @param {Event} event Should implement the input Event instance.
   * @param {Boolean} enforce Ignores the inserted value to trigger a input
   * change event.
   */
  _handleInputChange(event, enforce) {
    this.preventEvent = true;

    this.update('value', () => {
      if (this.inputElement && this.inputElement.value) {
        this.value = this.inputElement.value.value;
      }
    });

    if (enforce || this.value !== this.cachedValue) {
      this.mutated = true;

      if (this._strip(this.value)) {
        return this._handleSearch(event, (props) => {
          const { results } = props;

          this.preventEvent = false;
          this.updateResults(results);
        });
      } else {
        this.updateResults(null);
      }
    }

    this.preventEvent = false;
  }

  /**
   * Implements keyboard search for the custom element.
   *
   * @param {KeyboardEvent} event The inherited keydown event interface.
   */
  _handleInputKeyUp(event) {
    const { keyCode, target } = event;

    if (this._strip(target.value) && this.ignoredKeyCodes.includes(keyCode)) {
      return;
    }

    this.throttle(() => {
      this._handleEvent(event, this.inputElement.value, 'change');

      this.update('cachedValue', () => {
        this.cachedValue = target.value;
      });
    });
  }

  /**
   * Implements the custom onSearch function property to implement
   * the actual results from the defined query.
   *
   * @param {InputEvent} event The inherited input event that was dispatched
   * during the input change.
   * @param {Function} callback The custom element callback that will be
   * implemented after the change event has been completed.
   */
  _handleSearch(event, callback) {
    const handler = this._fn(this.onSearch);

    if (this.pending) {
      return;
    }

    try {
      if (typeof handler === 'function') {
        handler(this, callback);
      } else {
        callback(this);
      }
    } catch (exception) {
      this.disablePending();
      this._handleError(exception);
    }
  }

  /**
   * Callback that should return the  value from the selected result.
   *
   * @param {Object} result The selected result to return.
   */
  _handleSelect(result) {
    const handler = this._fn(this.onSelect);

    if (typeof handler === 'function') {
      handler(result);
    }
  }

  /**
   * Updates the defined element results before it will be rendered.
   * @param {Array} results Should contain a collaction with
   * @param {Boolean} force Will force the results to be emptied.
   */
  _updateResults(results) {
    if (results && Array.isArray(results) && results.length) {
      this.results = results;
    } else {
      this.results = [];
    }
  }

  /**
   * Create references for the interactive components within the custom element.
   */
  firstUpdated() {
    if (focusTrap && this.rootElement.value) {
      this.focusTrap = focusTrap.createFocusTrap(this.rootElement.value, {
        escapeDeactivates: true,
        allowOutsideClick: true,
      });
    }
  }

  /**
   * Renders the root element for the defined custom element.
   */
  _renderMain() {
    return html`
      ${this.icon && this._renderImage(this.icon, 'global-search__icon')}
        <input
          class="global-search__input"
          type="text"
          .disabled="${this._defineDisabled()}"
          placeholder="${this.placeholder}"
          @change="${this._handleInputChange}"
          @keyup="${this._handleInputKeyUp}"
          ${ref(this.inputElement)}
        />


        <button type="button" @click="${this._handleReset}" class="global-search__reset">
          ${this.resetLabel}
        </button>

        <button type="${this.action && !this.excludeFormElement ? 'submit' : 'button'}" @click="${
      this._handleButtonClick
    }" class="global-search__submit" .disabled="${this._defineDisabled()}">
          ${this.submitLabel}
        </button>
        <span class="global-search__progress-indicator">
          <span class="global-search__progress-indicator-ring"></span>
          <span class="global-search__progress-indicator-ring"></span>
          <span class="global-search__progress-indicator-ring"></span>
        </span>
      </form>
      ${
        this.currentElement && this._strip(this.value) && this._renderResults()
          ? html`<div class="global-search__overlay">${this._renderResults()}</div>`
          : ''
      }
    `;
  }

  /**
   * Renders the results that have been defined from the onSearch callback
   * handler.
   */
  _renderResults() {
    if (!Array.isArray(this.results) || !this.results.length) {
      // Display the optional no results label when there is a search query.
      if (this.noResultsLabel && this._strip(this.value) && !this.results.length && !this.pending) {
        return html`<span class="global-search__no-results">${this.noResultsLabel}</span>`;
      }

      return;
    }

    const results = this.results
      .map((result) => {
        const { link, title } = result;

        if (!title) {
          return;
        }

        if (link && !this.excludeResultLink) {
          const anchor = document.createElement('a');
          anchor.href = link;
          const origin = `//${anchor.hostname || anchor.pathname}`;

          return html`
            <li class="global-search__result">
              <a
                class="global-search__result-link"
                href="${link}"
                ${window.location.host.indexOf(origin) < 0 ? 'target="blank"' : ''}
              >
                ${this._renderResult(result)}
              </a>
            </li>
          `;
        }

        return html`
          <li class="global-search__result">
            <span class="global-search__result-label" @click="${() => this._handleSelect(result)}">
              ${this._renderResult(result)}
            </span>
          </li>
        `;
      })
      .filter((e) => e);

    return html`
      <ul class="global-search__results">
        ${results}
      </ul>
    `;
  }

  /**
   * Renders a single result within the global search overlay element.
   *
   * @param {Object} result The result to render.
   */
  _renderResult(result) {
    const { description, image, title } = result;

    return html`
      <span class="global-search__text-content">
        ${title ? html`<span class="global-search__result-title">${title}</span>` : ''}
        ${description ? html`<p class="global-search__result-description">${description}</p>` : ''}
      </span>
      ${image || (image && image.src)
        ? html`<span class="global-search__result-media-content">
            <img
              class="global-search__result-image"
              src="${image.src || image}"
              alt="${image.alt || ''}"
            />
          </span>`
        : ''}
    `;
  }

  /**
   * Preforms the instance update that should happen during a property change.
   */
  updated() {
    super.updated();

    if (this.focusTrap && this.currentElement && this.results.length) {
      this.focusTrap.activate();
    } else {
      this.focusTrap.deactivate();
    }

    this._focusInput();
  }

  /**
   * Renders the actual global-search component.
   */
  render() {
    this._handleRender(this);

    return html`
      <div class="global-search ${this._defineModifiers()}" ${ref(this.mainElement)}>
        ${this.excludeFormElement
          ? html`<div class="global-search__input-wrapper" ${ref(this.rootElement)}>
              ${this._renderMain()}
            </div>`
          : html` <form
              action="${this.action}"
              class="global-search__input-wrapper"
              @submit="${this._handleFormSubmit}"
              ${ref(this.rootElement)}
            >
              ${this._renderMain()}
            </form>`}
      </div>
    `;
  }

  /**
   * Assigns the pending state properties to the defined custom Element.
   */
  enablePending() {
    this.update('pending', () => {
      this.pending = true;
    });

    this.update('disabled', () => {
      this.disabled = true;
    });
  }

  /**
   * Removes the pending state from the defined custom element.
   */
  disablePending() {
    this.update('pending', () => {
      this.pending = false;
    });

    this.update('disabled', () => {
      this.disabled = false;
    });
  }
}

customElements.define('global-search', GlobalSearch);
