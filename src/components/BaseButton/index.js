import {
  LitElement,
  html,
  css,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js';

import style from './base-button.css.asset.js';

export class BaseButton extends LitElement {
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
      hideText: {
        type: Boolean,
      },
      fullWidth: {
        type: Boolean,
      },
      icon: {
        type: String,
      },
      iconSource: {
        type: String,
      },
      iconPlacement: {
        type: String,
      },
      minimal: {
        type: Boolean,
      },
      onClick: {},
      pending: {
        type: Boolean,
      },
      pressed: {
        type: Boolean,
      },
      type: {
        type: String,
      },
    };
  }

  constructor() {
    super();

    this.type = 'default';
    this.iconPlacement = 'before';
    this.minimal = false;
    this.fullWidth = false;
    this.hideText = false;
    this.pending = false;
    this.pressed = false;
    this.disabled = false;
  }

  _handleClick(event) {
    // Catch the initial click event and invoke any additional properties
    // for the custom element.
    event.stopImmediatePropagation();

    // Prevents any interaction during a request or if the element is disabled.
    if (this.pending || this.disabled) {
      return;
    }

    // Use the defined handler as function otherwise invoke the original
    // Event Handler.
    if (typeof this.onClick === 'function') {
      return this.onClick();
    } else {
      this.dispatchEvent(new Event('click'));
    }
  }

  /**
   * Flags the defined element as pressed for additional styling.
   */
  _handleMouseDown() {
    if (this.pressed || this.disabled) {
      return;
    }

    this.pressed = true;
  }

  /**
   * Reset the optional pressed state helpers.
   */
  _handleReset() {
    this.pressed = false;
  }

  /**
   * Defines the additional modifier classnames.
   */
  defineRootClassnames() {
    const classes = [];

    if (this.type) {
      classes.push(`base-button--${this.type}`);
    }

    if (this.size) {
      classes.push(`base-button--is-${this.size}`);
    }

    if (this.pressed) {
      classes.push('base-button--is-pressed');
    }

    if (this.disabled) {
      classes.push('base-button--is-disabled');
    }

    if (this.fullWidth) {
      classes.push('base-button--is-full-width');
    }

    if (this.minimal) {
      classes.push('base-button--is-minimal');
    }

    if (this.pending) {
      classes.push('base-button--is-pending');
    }

    if (this.testIcon(true)) {
      classes.push('base-button--with-icon');
      classes.push(`base-button--with-icon-${this.iconPlacement}`);
    }

    return classes.join(' ');
  }

  /**
   * Renders the actual icon as inline or external icon. And inline SVG element
   * will be used when the iconName property is defined.
   */
  defineIcon() {
    return this.testIcon()
      ? html`
          <svg class="base-button__icon" aria-hidden="true" focusable="false">
            <use xlink:href="${this.iconSource}#${this.iconName}"></use>
          </svg>
        `
      : html`
          <img
            class="base-button__icon"
            aria-hidden="true"
            focusable="false"
            src="${this.iconSource}"
          />
        `;
  }

  /**
   * Displays a progress indicator for the custom element.
   */
  renderProgressIndicator() {
    return this.pending
      ? html`
          <span class="base-button__progress-indicator">
            <span class="base-button__progress-indicator-ring"></span>
            <span class="base-button__progress-indicator-ring"></span>
            <span class="base-button__progress-indicator-ring"></span>
          </span>
        `
      : null;
  }

  /**
   * Renders a advanced ajax compatible button element with optional icon
   * displayment.
   */
  render() {
    return html`
      <button
        class="base-button ${this.defineRootClassnames()}"
        ?disabled="${this.disabled}"
        @click=${this._handleClick}
        @mousedown=${this._handleMouseDown}
        @mouseup=${this._handleReset}
        @mouseleave=${this._handleReset}
        @blur=${this._handleReset}
      >
        <span class="base-button__content">
          <span class="base-button__text">
            <slot></slot>
          </span>
          ${this.renderIcon()}
        </span>
        ${this.renderProgressIndicator()}
      </button>
    `;
  }

  /**
   * Renders the optional icon.
   * @returns
   */
  renderIcon() {
    return this.testIcon(true)
      ? html` <span class="base-button__icon-wrapper">${this.defineIcon()}</span> `
      : null;
  }

  /**
   * Check if the required icon properties are defined for an inline or
   * external icon.
   *
   * @param {Boolean} initial Will pas the statement if the iconSource is
   * defined.
   */
  testIcon(initial) {
    if (initial && this.iconSource) {
      return true;
    } else if (initial) {
      return false;
    }

    if (this.iconSource && this.icon) {
      return true;
    }

    return false;
  }
}

customElements.define('base-button', BaseButton);
