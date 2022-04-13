import { AmbachtElement, css, html } from '../../core/Ambacht.js';

import 'https://cdn.jsdelivr.net/npm/tabbable@5.2.1/dist/index.umd.min.js';
import 'https://cdn.jsdelivr.net/npm/focus-trap@6.7.3/dist/focus-trap.umd.min.js';

import style from './global-search.css.asset.js';

export class GlobalSearch extends AmbachtElement {
  static get styles() {
    return css`
      ${style}
    `;
  }

  static get properties() {
    return {
      disabled: {
        type: Boolean,
      },
      excludeFormElement: {
        type: Boolean,
      },
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
      excludePreviousResults: {
        type: Boolean,
      },
      icon: {
        type: String,
      },
    };
  }

  constructor() {
    super({
      name: 'global-search',
      delay: 100,
    });

    // The readable label for the submit button.
    this.submitLabel = 'Search';

    // Displays the label when no results have been defined.
    this.noResultsLabel = 'No results';

    // Keeps the previous defined results if no results are found from the
    // search phase.
    this.excludePreviousResults = false;

    // Won't render the anchor element if the result contain a valid link.
    this.excludeResultLink = false;

    // Stores the found results inherited from the element onSearch callback.
    this.results = [];

    // Enable an indicator when TRUE.
    this.pending = false;

    // Use the defined delay to throttle the keyDown handler.
    this.throttleDelay = 500;

    //
    this.excludeFormElement = false;
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

    if (this.currentElement && this.results.length) {
      modifiers.push('global-search--is-active');
    }

    if (this.pending) {
      modifiers.push('global-search--is-pending');
    }

    return modifiers.join('\n');
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

  _handleInputChange(event, enforce) {
    this.preventEvent = true;

    this._update('value', () => {
      this.value = this.inputElement.value;
    });

    if (enforce || this.value !== this.cachedValue) {
      if (this.value.split(' ').join('').length) {
        return this._handleSearch(event, (props) => {
          const { results } = props;

          this.preventEvent = false;
          this._updateResults(results);
        });
      } else {
        this._updateResults(null, true);
      }
    }

    this.preventEvent = false;
  }

  /**
   * Implements keyboard search for the custom element.
   *
   * @param {KeyboardEvent} event The inherited keydown event interface.
   */
  _handleInputKeydown(event) {
    const { keyCode } = event;

    // Removes the currentElement flag if the [escape] key is pressed.
    if (keyCode === 27) {
      this._update('currentElement', () => {
        event.target.blur();
      });
    }

    if (this.value && this.ignoredKeyCodes.includes(keyCode)) {
      return;
    }

    this._throttle(() => {
      this._handleEvent(event, 'change');

      this._update('cachedValue', () => {
        this.cachedValue = this.value;
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

    if (typeof handler === 'function') {
      handler(this, callback);
    } else {
      callback(this);
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
  _updateResults(results, force) {
    if (results && Array.isArray(results) && results.length) {
      this.results = results;
    } else if (force || this.excludePreviousResults) {
      this.results = [];
    }
  }

  /**
   * Create references for the interactive components within the custom element.
   */
  firstUpdated() {
    this.inputElement = this.renderRoot.querySelector('input');
    this.rootElement = this.renderRoot.querySelector('.global-search');
    this.formElement = this.renderRoot.querySelector('form');

    if (focusTrap) {
      this.focusTrap = focusTrap.createFocusTrap(this.rootElement, {
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
          @keydown="${this._handleInputKeydown}"
        />
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
        this.currentElement && this.results.length
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
      if (this.noResultsLabel && this.value) {
        return html`<span>${this.noResultsLabel}</span>`;
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
    if (this.focusTrap && this.currentElement && this.results.length) {
      this.focusTrap.activate();
    } else {
      this.focusTrap.deactivate();
    }
  }

  /**
   * Renders the actual global-search component.
   */
  render() {
    return html`
      <div class="global-search ${this._defineModifiers()}">
        ${this.excludeFormElement
          ? html`<div class="global-search__input-wrapper">${this._renderMain()}</div>`
          : html` <form
              action="${this.action}"
              class="global-search__input-wrapper"
              @submit="${this._handleFormSubmit}"
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
    this._update('pending', () => {
      this.pending = true;
    });

    this._update('disabled', () => {
      this.disabled = true;
    });
  }

  /**
   * Removes the pending state from the defined custom element.
   */
  disablePending() {
    this._update('pending', () => {
      this.pending = false;
    });

    this._update('disabled', () => {
      this.disabled = false;
    });
  }
}

customElements.define('global-search', GlobalSearch);
