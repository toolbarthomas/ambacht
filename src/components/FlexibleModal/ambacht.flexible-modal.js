import { AmbachtElement, createRef, css, html, ref } from '../../core/Ambacht.js';

import styles from './ambacht.flexible-modal.css.asset.js';

export class FlexibleModal extends AmbachtElement {
  constructor(props) {
    super();

    const {
      alignTop,
      alignRight,
      alignBottom,
      alignLeft,
      closeOnBackdropClick,
      isExpanded,
      isFullscreen,
    } = props || {};

    this.closeLabel = 'Close';
    this.closeOnBackdropClick = closeOnBackdropClick || false;

    this.isExpanded = isExpanded || false;

    this.isFullscreen = isFullscreen || false;

    this.alignTop = alignTop || false;
    this.alignRight = alignRight || false;
    this.alignBottom = alignBottom || false;
    this.alignLeft = alignLeft || false;

    this.focusContext = this.context;
    this.offsetContext = createRef();
    this.wrapperContext = createRef();

    this.panelContentContext = createRef();
    this.isSticky = false;
    this.hasOverflow = false;
  }

  static get properties() {
    return {
      alignTop: {
        type: Boolean,
      },
      alignRight: {
        type: Boolean,
      },
      alignBottom: {
        type: Boolean,
      },
      alignLeft: {
        type: Boolean,
      },
      closeLabel: {
        type: String,
      },
      closeOnBackdropClick: {
        type: Boolean,
      },
      onOpen: {},
      isExpanded: {
        type: Boolean,
      },
      isFullscreen: {
        type: Boolean,
      },
      data: {},
    };
  }

  static get styles() {
    return styles;
  }

  /**
   * Assigns the JIT Event listeners for the initial module.
   */
  firstUpdated() {
    super.firstUpdated();

    if (this.wrapperContext && this.wrapperContext.value) {
      this.wrapperContext.value.addEventListener('scroll', this.handleWrapperScroll.bind(this));
      this.wrapperContext.value.addEventListener('click', this.handleWrapperClick.bind(this));
    }

    if (this.panelContentContext && this.panelContentContext.value) {
      this.panelContentContext.value.addEventListener(
        'scroll',
        this.handlePanelContentScroll.bind(this)
      );
    }
  }

  /**
   * Defines the container classes for the rendered state.
   */
  defineContainerClasses() {
    const classes = [];

    if (this.isFullscreen) {
      classes.push('flexible-modal--is-fullscreen');
    }

    if (this.alignTop) {
      classes.push('flexible-modal--aligns-from-top');
    }

    if (this.alignRight) {
      classes.push('flexible-modal--aligns-from-right');
    }

    if (this.alignBottom) {
      classes.push('flexible-modal--aligns-from-bottom');
    }

    if (this.alignLeft) {
      classes.push('flexible-modal--aligns-from-left');
    }

    return classes.join(' ');
  }

  /**
   * Defines the header classes for the rendered state.
   */
  defineHeaderClasses() {
    const classes = [];

    if (this.hasOverflow) {
      classes.push('flexible-modal__panel-header--has-overflow');
    }

    return classes.join(' ');
  }

  /**
   * Click handler that will trigger the component if the clicked target is
   * family from the component.
   *
   * @param {Event} event The inherited click event interface.
   */
  handleClick(event) {
    const { target } = event;

    if (this._isComponentContext(target)) {
      return;
    }

    let ariaControls = target.getAttribute('aria-controls')
      ? `#${target.getAttribute('aria-controls')}`
      : target.getAttribute('href');

    if (!ariaControls && target.closest('[aria-controls]')) {
      ariaControls = `#${target.closest('[aria-controls]').getAttribute('aria-controls')}`;
    } else if (!ariaControls && target.closest('[href^="#"]')) {
      ariaControls = `#${target.closest('[href^="#"]').getAttribute('href')}`;
    }

    if (!ariaControls || ariaControls.length === 1 || ariaControls.indexOf('#') !== 0) {
      return;
    }

    console.log('click');

    event.preventDefault();

    const ariaTarget = document.querySelector(ariaControls);

    if (ariaTarget !== this || !this.contains(ariaTarget)) {
      this.handleClose(event);
    } else if (ariaTarget === this || this.contains(ariaTarget)) {
      this.handleOpen(event);
    }
  }

  /**
   * Main handler to for closing the modal.
   *
   * @param {Event} event The event interface that was inherited from the
   * initiated document Event.
   */
  handleClose() {
    if (!this.isExpanded) {
      return;
    }

    this._update('isExpanded', () => (this.isExpanded = false));
  }

  /**
   * Helper function to initiate a subscribe callback hook.
   *
   * @param {Event} event The event interface that was inherited from the
   * intiated document Event.
   */
  handleHook(event) {
    if (!event || !event.detail) {
      return;
    }

    console.log('handleHook');

    const { target } = event.detail;

    if (!this._isComponentContext(target)) {
      return;
    }

    switch (event.type) {
      case 'modal:open':
        this.handleOpen(event);
        break;
      case 'modal:update':
        this.handleUpdate(event);
        break;

      default:
        this.log(`No hook has been subscribed as ${event.type}`);
        break;
    }
  }

  /**
   * Enables support to close the modal with the keyboard.
   * @param {*} event
   * @returns
   */
  handleKey(event) {
    const { keyCode } = event;

    if (!keyCode || !this.exitKeyCodes.includes(keyCode)) {
      return;
    }

    this.handleClose();
  }

  /**
   * Opens the modal.
   *
   * @param {Event} event The event interface that was inherited from the
   * original Document Event Listener.
   */
  handleOpen(event) {
    if (this.isExpanded) {
      return;
    }

    const onOpen = this._fn(this.onOpen);

    this._handleEvent(event, this, onOpen);

    this._update('isExpanded', () => (this.isExpanded = true));
  }

  /**
   * Updates the modal after a global resize.
   *
   * @param {Event} event The event interface that was inherited from the
   * resize Event.
   */
  handleResize(event) {
    this._throttle(() => {
      this.handleWrapperScroll();
      this.handlePanelContentScroll();
    });
  }

  /**
   * Updates the modal dynamic slot content.
   *
   * @param {Event} event The event interface that was inherited from the
   * original Document Event Listener.
   */
  handleUpdate(event) {
    if (!event || !event.detail) {
      return;
    }

    const { data } = event.detail;

    this._update('data', () => (this.data = data && data.length ? data : null));
  }

  /**
   * Enable the modal close action when the 'backdrop' element is clicked.
   *
   * @param {Event} event The event interface that was inherited from the
   * original Click Event.
   */
  handleWrapperClick(event) {
    const { target } = event;

    if (!this.isExpanded) {
      return;
    }

    if (!target || !this.offsetContext || !this.offsetContext.value) {
      return;
    }

    if (this.offsetContext.value === target || this.offsetContext.value.contains(target)) {
      return;
    }

    if (this.contains(target)) {
      return;
    }

    this._update('isExpanded', () => (this.isExpanded = false));
  }

  /**
   * Ensures the header position is altered for non fullscreen variants.
   *
   * @param {*} event
   * @returns
   */
  handleWrapperScroll() {
    if (!this.wrapperContext || !this.wrapperContext.value) {
      return;
    }

    if (!this.offsetContext || !this.offsetContext.value) {
      return;
    }

    const { paddingTop } = getComputedStyle(this.offsetContext.value);

    if (!paddingTop) {
      return;
    }

    const offset = parseFloat(paddingTop.replace('px', ''));

    if (isNaN(offset) || !offset) {
      return;
    }

    this._throttle(() => {
      this._update('isSticky', () => {
        if (this.wrapperContext.value.scrollTop > offset) {
          this.isSticky = true;
        } else {
          this.isSticky = false;
        }
      });
    });
  }

  /**
   * Implements the overflow indicator for the fullscreen variant.
   */
  handlePanelContentScroll() {
    if (!this.panelContentContext || !this.panelContentContext.value) {
      return;
    }

    const { scrollTop } = this.panelContentContext.value;

    this._update('hasOverflow', () => {
      if (scrollTop) {
        this.hasOverflow = true;
      } else {
        this.hasOverflow = false;
      }
    });
  }

  /**
   * The main render method.
   */
  render() {
    return html`<div
      class="flexible-modal ${this.defineContainerClasses()}"
      aria-hidden="${this.isExpanded ? 'false' : 'true'}"
      aria-disabled="${this.isExpanded ? 'false' : 'true'}"
      ${ref(this.context)}
    >
      <div class="flexible-modal__wrapper" ${ref(this.wrapperContext)}>
        <div
          class="flexible-modal__panel ${this.isSticky && !this.isFullscreen
            ? 'flexible-modal__panel--is-sticky'
            : ''}"
          ${ref(this.offsetContext)}
        >
          ${this.renderHeader()}${this.renderContent()}
        </div>
      </div>
    </div>`;
  }

  /**
   * Render the header container element.
   */
  renderHeader() {
    return html`
      <header class="flexible-modal__panel-header ${this.defineHeaderClasses()}">
        <slot name="header"></slot>${this.renderClose()}
      </header>
    `;
  }

  /**
   * Renders the dynamic content or use the initial content as fallback.
   */
  renderContent() {
    return html`
      <div class="flexible-modal__panel-content" ${ref(this.panelContentContext)}>
        ${this.data ? html`${this.data}` : html`<slot></slot>`}
      </div>
    `;
  }

  renderClose() {
    return html`
      <button class="flexible-modal__close" @click="${this.handleClose}">
        <span class="flexible-modal__close-label">${this.closeLabel}</span>
      </button>
    `;
  }

  /**
   * Assigns the required Event listeners to enable the modal component.
   */
  connectedCallback() {
    super.connectedCallback();

    this.subscribeGlobalEvent('click', this.handleClick);
    this.subscribeGlobalEvent('keyup', this.handleKey);
    this.subscribeGlobalEvent('modal:open', this.handleHook);
    this.subscribeGlobalEvent('modal:update', this.handleHook);
    this.subscribeGlobalEvent('resize', this.handleResize, window);
  }

  /**
   * Removes the required Event listeners from the modal.
   */
  disconnectedCallback() {
    super.disconnectedCallback();

    this.unsubscribeGlobalEvent('click', this.handleClick);
    this.unsubscribeGlobalEvent('keyup', this.handleKey);
    this.unsubscribeGlobalEvent('modal:open', this.handleHook);
    this.unsubscribeGlobalEvent('modal:update', this.handleHook);
    this.unsubscribeGlobalEvent('resize', this.handleResize);

    if (this.wrapperContext && this.wrapperContext.value) {
      this.wrapperContext.value.removeEventListener('scroll', this.handleWrapperScroll);
      this.wrapperContext.value.removeEventListener('click', this.handleWrapperClick);
    }

    if (this.panelContentContext && this.panelContentContext.value) {
      this.panelContentContext.value.removeEventListener('scroll', this.handlePanelContentScroll);
    }
  }

  /**
   * Call the mandatory after a prop change.
   */
  updated() {
    if (this.isExpanded) {
      this.lockFocus();
    } else {
      this.unlockFocus();

      if (this.wrapperContext && this.wrapperContext.value) {
        this.wrapperContext.value.scrollTop = 0;
      }
    }
  }
}

customElements.define('flexible-modal', FlexibleModal);
