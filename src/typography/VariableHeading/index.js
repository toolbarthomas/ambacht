import {
  LitElement,
  html,
  css,
} from 'https://cdn.jsdelivr.net/gh/lit/dist@2.2.1/core/lit-core.min.js';

import style from './variable-heading.css.asset.js';

export class VariableHeading extends LitElement {
  static get styles() {
    return css`
      ${style}
    `;
  }

  static get properties() {
    return {
      as: {
        type: String,
      },
      link: {
        type: String,
      },
      size: {
        type: String,
      },
      target: {
        type: String,
      },
      onClick: {},
    };
  }

  constructor() {
    super();

    this.defaultElement = 'h1';
    this.as = this.defaultElement;
    this.target = '_self';
    this.size = this.defaultElement;
    this.allowedElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    this.allowedSizes = ['display1', 'display2', 'display3', ...this.allowedElements];
  }

  _defineClassnames() {
    const classes = ['variable-heading'];

    if (this.modifierElement) {
      classes.push(`variable-heading--${this.modifierElement}`);
    }

    if (this.size && this.allowedSizes.includes(this.size)) {
      classes.push(`variable-heading--as-${this.size}`);
    } else if (this.as && this.allowedElements.includes(this.as)) {
      classes.push(`variable-heading--as-${this.as}`);
    }

    return classes.join(' ');
  }

  _handleClick(event) {
    if (typeof this.onClick === 'function') {
      event.preventDefault();

      return this.onClick(event, this);
    }
  }

  _renderContents() {
    if (this.link) {
      return html`<a href="${this.link}" target="${this.target}"><slot></slot></a>`;
    }

    return html`<slot></slot>`;
  }

  /**
   * Renders a advanced ajax compatible button element with optional icon
   * displayment.
   */
  render() {
    switch (this.as) {
      case 'h6':
        return html` <h6 class="${this._defineClassnames()}">${this._renderContents()}</h6> `;
        break;

      case 'h5':
        return html` <h5 class="${this._defineClassnames()}">${this._renderContents()}</h5> `;
        break;

      case 'h4':
        return html` <h4 class="${this._defineClassnames()}">${this._renderContents()}</h4> `;
        break;

      case 'h3':
        return html` <h3 class="${this._defineClassnames()}">${this._renderContents()}</h3> `;
        break;

      case 'h2':
        return html` <h2 class="${this._defineClassnames()}">${this._renderContents()}</h2> `;
        break;

      default:
        return html` <h1 class="${this._defineClassnames()}">${this._renderContents()}</h1> `;
        break;
    }
  }
}

customElements.define('variable-heading', VariableHeading);
