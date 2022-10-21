/*
 - encoding: utf-8
 -
 - Copyright (c) 2011-2021 Cloudware S.A. All rights reserved
 - Copyright (c) 2011-2021 OCC Ordem dos Contabilistas Certificados. All rights reserved.
 -
 */

import { html, css, LitElement } from 'lit';
import '@cloudware-casper/casper-icons/casper-icons.js';

class CasperPinInput extends LitElement {

  static properties = {
    value: {
      type: String,
      reflect: true
    },
    type: {
      type: String,
      reflect: true
    },
    pattern: {
      type: String
    },
    disabled: {
      type: Boolean
    },
    hidden: {
      type: Boolean,
      reflect: true
    },
    focused: {
      type: Boolean
    },
    errorMessage: {
      type: String
    },
    readonly: {
      type: Boolean
    }
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }

    .digits {
      display: flex;
      position: relative;
      gap: 4px;
    }

    .digit {
      width: 24px;
      height: 34px;
      font-size: 24px;
      text-align: center;
      color: var(--primary-text-color, #000);
      border-radius: 6px;
      border: 1px solid #888;
      padding: 1px;
      background-color: white;
      line-height: 34px;
    }

    .digit-selected {
      background-color: rgb(179,215,254);
    }

    .invalid-digit {
      border: 2px solid var(--status-red, red);
      padding: 0px;
    }

    .focused {
      border: 2px solid var(--primary-color, #008);
      padding: 0px;
    }

    .cursor {
      border-left: 2px solid transparent;
      border-right: 2px solid var(--primary-color, #008);
      animation: blinker 2s infinite;
    }

    .left-cursor {
      border-right: 2px solid transparent;
      border-left: 2px solid var(--primary-color, #008);
      animation: blinker 2s infinite;
    }

    .not-cursor {
      border-left: 2px solid transparent;
      border-right: 2px solid transparent;
    }

    @keyframes blinker {
      50% {
        border-left:  2px solid transparent;
        border-right: 2px solid transparent;
      }
    }

    input {
      left: 0;
      top: 0;
      position: absolute;
      opacity: 0.0;
      font-size: 24px;
      font-family: monospace;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      color: red;
      background-color: transparent;
      user-select: none;
      pointer-events: none;
    }

    .space {
      display: inline-flex;
      min-width: 10px;
      align-items: flex-end;
      height: 34px;
      margin-right: 4px;
    }

    .separator {
      display: inline-flex;
      align-items: flex-end;
      color: var(--primary-text-color);
      font-size: 34px;
      height: 38px;
      margin-right: 6px;
    }

    casper-icon {
      color: var(--primary-color);
    }

    .error-label {
      color: var(--status-red);
      font-size: 12px;
      width: 100%;
      min-height: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .eye {
      align-self: center;
    }
  `;

  constructor () {
    super();
    this.disabled = false;
    this.hidden   = false;
    this.type     = 'text';
    this.pattern  = '####';
    this.value    = '';
    this.focused  = false;
    this.readonly = false;
    this.addEventListener('focus', (event) => this.focused = true);
    this.addEventListener('blur', (event) => this.focused = false);
    this.addEventListener('click', (event) => this._click(event) );
  }

  //***************************************************************************************//
  //                                ~~~ LIT life cycle ~~~                                 //
  //***************************************************************************************//

  firstUpdated (changedProperties) {
    if ( changedProperties.has('value') ) {
      if ( this.type === 'euro' ) {
        this.value = this._convertEuro(this.value);
      }
    }
    this._input = this.shadowRoot.getElementById('input');
    this._input.value = this.value;
    this._input.selectionStart = this._input.selectionEnd = 0;
    if ( this.value !== '' && this.value !== '.' ) {
      this.requestUpdate();
    }
  }

  willUpdate (changedProperties) {

    if ( changedProperties.has('focused') ) {
      if ( this._input && this.focused ) {
        this._input.focus();
      }
    }

    if ( changedProperties.has('pattern') ) {
      const sepIdx = this.pattern.replace(',','.').lastIndexOf('.');
      if ( sepIdx == - 1) {
        this._integerWidth  = this.pattern.match(/#/g).length;
        this._fractionWidth = 0;
      } else {
        this._integerWidth  = this.pattern.substring(0, sepIdx).match(/#/g).length;
        this._fractionWidth = this.pattern.substring(sepIdx).match(/#/g).length;
      }
      this._maxWidth = this._integerWidth + this._fractionWidth;
    }

    if ( changedProperties.has('value') ) {
      this.errorMessage = undefined;
      if ( this._input ) {
        this._input.value = this.value;
      }
    }
  }

  render () {

    let displayValue, cursor, cursorClass, selected, idx = 0, pad = 0, ilen;

    const input = this._input;
    if ( ! input ) {
      displayValue = '';
      cursor       = 0;
      cursorClass  = 'cursor';
    } else {

      if ( this.type === 'euro' && input ) {

        // ... ilen is the length of the input integer part, padding is added to fill the width of integer field
        ilen = input.value.indexOf('.') === - 1 ? input.value.length : input.value.indexOf('.');
        pad  = this._integerWidth - ilen;

        displayValue = ''.padStart(pad) + input.value.replace('.','');

        if ( input.selectionStart <= ilen ) {
          // ... we are in the euro zone (pun intented) align cursor relative to the right side ...
          cursor = this._integerWidth - (ilen - input.selectionStart ) - 1;
          if ( input.selectionStart === 0 && ilen !== 0 ) {
            cursor     += 1;
            cursorClass = 'left-cursor';
          } else {
            cursorClass = 'cursor';
          }
        } else {
          // ... we are in the cent zone cursor swapped to left except at the end ...
          cursor = this._integerWidth + input.selectionStart - input.value.indexOf('.') - 1;
          if ( cursor === this._maxWidth ) {
            cursor     -= 1;
            cursorClass = 'cursor';
          } else {
            cursorClass = 'left-cursor';
          }
        }

      } else {

        displayValue = this.value;
        cursor       = input.selectionStart;
        if ( cursor === this._maxWidth ) {
          cursor      -= 1;
          cursorClass  = 'cursor';
        } else {
          cursorClass  = 'left-cursor';
        }
      }
    }

    const digits = [];

    for ( let i = 0; i < this.pattern.length; ++i ) {
      switch (this.pattern[i]) {
        case ' ':
          digits.push(html`<span class="space"></span>`);
          break;
        case '.':
        case ',':
          digits.push(html`<div class="separator">${this.pattern[i]}</div>`);
          break;
        case '#':
          selected = '';
          if (input && this.focused && input.selectionEnd !== input.selectionStart ) {
            if ( (idx - pad) >= input.selectionStart && (idx - pad) < input.selectionEnd && displayValue[idx] !== undefined ) {
              selected = ' digit-selected';
            }
          }
          digits.push(html`
            <div .digitIdx=${idx} class="digit ${this.errorMessage ? 'invalid-digit' : this.focused ? 'focused' : ''}${selected}">
              <span class="${idx === cursor && this.focused ? cursorClass : 'not-cursor'}">
                ${this.hidden ? displayValue[idx] ? html`&#8226;` : '' : displayValue[idx]}
              </span>
            </div>`);
          idx++;
          break;
        default:
          break;
      }
    }
    return html`
      <div>
        <div class="digits">
          ${digits}
          <input id="input"
                 type="text"
                 ?disabled=${this.disabled}
                 autocomplete="off"
                 tabindex="1"
                 @keydown=${(e) => this._keyDown(e)}
                 @keyup=${(e)   => this._onKeyUp(e)}
                 @input=${(e)   => this._onInput(e)}
                 @paste=${(e)   => this._paste(e)}>
          </input>
          ${ this.type === 'password' ? html
          `<casper-icon class="eye"
            icon="${this.hidden ? 'fa-solid:eye-slash' : 'fa-solid:eye'}"
            @click="${(e) => this.hidden = !this.hidden}">
          </casper-icon>`: ''}
        </div>
      </div>
      <span class="error-label">${this.errorMessage || this._warning}</span>
    `;
  }

  updated (changedProperties) {
    if ( changedProperties.has('focused') ) {
      if ( this._input && this.focused ) {
        this._input.focus();
      }
    }
  }

  /**
   *
   * @param {Event} event
   */
  _keyDown (event) {

    // ... do not mess with control sequence keys ...
    if ( event.altKey || event.ctrlKey || event.metaKey ) {
      return;
    }

    // ... handle shift-tab try to pass focus to previous shadow root sibling ...
    if ( event.key === 'Tab' ) {
      if ( event.shiftKey ) {
        this._focusPrevious();
        event.preventDefault();
      }
      return;
    }

    const start = event.target.selectionStart;
    const end   = event.target.selectionEnd;

    // ... apply input validation only for single character keys ...
    if ( event.key && event.key.length === 1 ) {
      if ( '0123456789'.includes(event.key) ) {

        if ( this.type === 'euro' ) {

          // ... ilen is the length of the input integer part
          const input = this._input;
          const ilen  = input.value.indexOf('.') === - 1 ? input.value.length : input.value.indexOf('.');
          const [ euros, cents ] = input.value.split('.');

          if ( input.selectionStart <= ilen ) {
            if ( euros.length < this._integerWidth ) {
              this._checkReadOnly(event);
              return; // ... accept euro digit ...
            }
          } else {
            if ( (cents || '').length < this._fractionWidth ) {
              this._checkReadOnly(event);
              return; // ... accept cent digit ...
            }
          }

        } else {
          if ( this._input.value.length < this._maxWidth ) {
            this._checkReadOnly(event);
            return;
          }
        }
      }

      // ... replace commas with dot, only allow the separator once ...
      if ( this.type === 'euro' && '.,'.includes(event.key) ) {
        if ( event.target.value.includes('.') ) {
          // ... we already have a separator just move the cursor ...
          event.target.selectionStart = event.target.selectionEnd = this._integerWidth + 1;
        } else {
          event.target.value += '.';  // ... this is the first ocurrence accept
        }
      }

      // ... all other single letter inputs banned ...
      if ( ! (this.type === 'euro' && '.,'.includes(event.key)) && this._input.value.length < this._maxWidth) {
        this._showWarning(`Letra '${event.key}' não é válida`);
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // ... prevent the dot from being deleted, just make the cursor jump over it ...
    if ( event.key === 'Backspace' ) {
      if ( start === end ) {
        if ( event.target.value[start - 1] === '.') {
          event.target.selectionStart = event.target.selectionEnd = start - 1;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    } else if ( event.key === 'Delete' ) {
      if ( start === end ) {
        if ( event.target.value[start] === '.') {
          event.target.selectionStart = event.target.selectionEnd = start + 1;
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
    }
  }

  _onInput (event) {
    this.value = event.target.value.replace(/[^0-9,.]/g, '');
    this._input.value = this.value;
  }

  _onKeyUp (event) {
    // ... the state of the hidden input may have changed so we request a re-render just in case ...
    this.requestUpdate();

    if ( '0123456789'.includes(event.key) ) {
      if ( this.type === 'euro') {
        /* TODO
        if ( this._fraction.length === 2 ) {
          this._focusNext();
        }*/
      } else {
        if ( event.target.selectionStart === this._maxWidth && '0123456789'.includes(event.key)) {
          this._focusNext();
        }
      }
    }
  }

  _click ( event ) {

    const targetPath = event.composedPath();
    event.composedPath().forEach(element => {
      if ( element instanceof HTMLElement && element.digitIdx !== undefined ) {
        const input = this._input;
        if ( input ) {
          if ( this.type === 'euro') {
            // ... ilen is the length of the input integer part, padding is added to fill the width of integer field
            const ilen = input.value.indexOf('.') === - 1 ? input.value.length : input.value.indexOf('.');
            const pad  = this._integerWidth - ilen;

            if ( element.digitIdx >= this._integerWidth ) {
              input.selectionStart = input.selectionEnd = element.digitIdx - pad + 1;
            } else {
              if ( element.digitIdx >= pad ) {
                input.selectionStart = input.selectionEnd = element.digitIdx - pad + 1;
              } else {
                input.selectionStart = input.selectionEnd = 0;
              }
            }

          } else {
            input.selectionStart = this._input.selectionEnd = element.digitIdx;
          }

          this.requestUpdate();
        }
      }
    });

    if ( this.focused ) {
      if ( this._input ) {
        this._input.focus();
      }
    } else {
      this.focused = true;
    }
    // TODO align cursor
  }

  _paste (event) {

    if ( this.readonly ) {
      event.preventDefault();
      event.stopPropagation();
      this._showWarning();
      return;
    }

    let value = (event.clipboardData || window.clipboardData).getData('text');

    event.preventDefault();

    if ( this.type === 'iban' ) {
      value = value.replace(/PT50/i, '');  // strip iban prefix
    }

    if ( this.type === 'euro') {
      value = this._convertEuro(value);
    } else {
      value = value.replace(/[^0-9]/g, ''); // strip non numeric chars
    }

    // ... accept new value and align input ...
    this.value = this._input.value = value;

    this._focusNext();
  }

  _convertEuro (value) {
    let euros, cents, m;

    // cleanup and then try to match the trailing cents
    value = value.toString().trim();
    value = value.replace(/[^0-9,.]/g, '');
    m = value.match(/(?<sep>[.,])(?<cents>\d+)$/);
    if ( m ) {
      cents = m.groups.cents.substring(0, this._fractionWidth);
      cents = cents.padEnd(this._fractionWidth, '0');
      euros = value.substring(0, m.index);
    } else {
      cents = '';
      euros = value;
    }
    euros = euros.replace(/[.,\s]/g, '');
    euros = euros.substring(euros.length - this._integerWidth, euros.length);

    return `${euros}.${cents}`;
  }

  _focusPrevious () {
    const tabbables = (this.parentElement || this.parentNode).querySelectorAll('[tabindex]');
    if ( tabbables ) {
      tabbables.forEach((element, index) => {
        if ( this === element ) {
          if ( index - 1 >= 0 ) {
            tabbables[index - 1].focus();
            this.focused = false;
          }
        }
      });
    }
  }

  _focusNext () {


    this.dispatchEvent(
      new CustomEvent('on-focus-next', {
        detail: {
          element: this
        }
      })
    );


    const tabbables = (this.parentElement || this.parentNode).querySelectorAll('[tabindex]');
    if ( tabbables ) {
      tabbables.forEach((element, index) => {
        if ( this === element ) {
          if ( index + 1 < tabbables.length ) {
            tabbables[index + 1].focus();
            this.focused = false;
          }
        }
      });
    }
  }

  _checkReadOnly (event, message) {
    if ( this.readonly ) {
      event.preventDefault();
      event.stopPropagation();
      this._showWarning(message);
      return true;
    } else {
      return false;
    }
  }

  _showWarning (message) {
    clearTimeout(this._warningTimer);
    this._warning = message || 'Este campo não pode ser modificado';
    this._warningTimer = setTimeout( (event) => {
      this._warning = '';
      this.requestUpdate();
    }, 2000);
  }

}

customElements.define('casper-pin-input', CasperPinInput);