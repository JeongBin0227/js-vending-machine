import { ERROR_MESSAGES, PRODUCT_PRICE, PRODUCT_QUANTITY } from '../constants/index.js';
import { $, $$, hasBlankString } from "../util/index.js";
import store from '../store/index.js';
import { observe } from '../core/observer.js';
import { addProduct, updateProduct } from '../store/actions.js';
import View from "./View.js"

export default class ProductManage extends View {
  $inputs;
  productInfo = {};
  errorMessages = {};

  init() {
    this.$inputs = $$("#product-add-form input");
    this.setEvent();

    observe(() => {
      this.renderProductItem()
    })
  }

  setEvent() {
    this.on("submit", (e) => {
      e.preventDefault();
      this.setStates();
      this.showErrorMessage();
      
      if (this.isValidInputsAll()) {
        const itemIndex = this.getStoreProductIndex();
        if (itemIndex >= 0) {
          this.updateProduct(itemIndex);
        } else {
          this.addProduct();
        }
        this.resetInputValue();
      }
    });
  }

  setStates() {
    this.$inputs.forEach(($input) => {
      const { dataset: { key }, value } = $input;
      this.setProductInfo(key, value);
      this.setErrorMessages(key, this.getErrorMessage(key, value));
    });
  }

  setProductInfo(key, value) {
    if (this.productInfo[key] !== value) this.productInfo = { ...this.productInfo, [key]: value };
  }

  setErrorMessages(key, value) {
    if(this.errorMessages[key] !== value) this.errorMessages = { ...this.errorMessages, [key]: value };
  }

  addProduct() {
    store.dispatch(addProduct({
      product: this.productInfo
    }))
  }

  updateProduct(itemIndex) {
    store.dispatch(updateProduct({
      product: this.productInfo,
      itemIndex
    }))
  }

  isValidInputsAll() {
    const errorValues = Object.values(this.errorMessages);
    return errorValues.length > 0 && errorValues.filter((value) => value === "").length === errorValues.length;
  }

  getStoreProductIndex() {
    const { products } = store.getState();
    return products.findIndex(v => v.name === this.productInfo.name);
  }

  getErrorMessage(key, value) {
    if (value === "") return ERROR_MESSAGES.NO_VALUE;

    switch (key) {
      case "name":
        return hasBlankString(value) ? ERROR_MESSAGES.INVALID_PRODUCT_NAME : "";
      case "price":
        return value < PRODUCT_PRICE.MIN || value % PRODUCT_PRICE.MIN_UNIT ? ERROR_MESSAGES.INVALID_PRICE : "";
      case "quantity":
        return value < PRODUCT_QUANTITY.MIN ? ERROR_MESSAGES.INVALID_QUANTITY : "";
      default: return "";
    }
  }

  showErrorMessage() {
    this.$inputs.forEach($input => {
      const { dataset: { key } } = $input;
      const $errorEl = $input.nextElementSibling;
      const errorMessage = this.errorMessages[key];

      if($errorEl.innerText !== errorMessage) $errorEl.innerText = errorMessage;
      $input.parentNode.classList[errorMessage ? "add" : "remove"]('is-error');
    });
  }

  resetInputValue() {
    this.$inputs.forEach($input => {
      $input.value = "";
    });
  }

  renderProductItem() {
    const $productInventoryContainer = $("#product-inventory-container");
    const { products } = store.getState();

    $productInventoryContainer.replaceChildren();

    const html = `
    ${products.map(({ name, price, quantity }) => (`
      <tr>
        <td>${name}</td>
        <td>${price}</td>
        <td>${quantity}</td>
      </tr> 
    `)).join("")}`;

    $productInventoryContainer.insertAdjacentHTML("afterbegin", html);
  }

  render() {
    /* html */
    return `
    <h3>상품 추가하기</h3>
    <div class="product-container">
      <form id="product-add-form">
        <fieldset class="fieldset">
          <label for="product-name-input">
            <input type="text" id="product-name-input" data-key="name" placeholder="상품명" />
            <span class="error-message"></span>
          </label>
          <label for="product-price-input">
            <input type="number" id="product-price-input" data-key="price" placeholder="가격" />
            <span class="error-message"></span>
          </label>
          <label for="product-quantity-input">
            <input type="number" id="product-quantity-input" data-key="quantity" placeholder="수량" />
            <span class="error-message"></span>
          </label>
        </fieldset>
        <button id="product-add-button" type="submit">추가하기</button>
      </form>
    </div>
    <h3>상품 현황</h3>
    <table class="product-inventory">
      <colgroup>
        <col style="width: 140px" />
        <col style="width: 100px" />
        <col style="width: 100px" />
      </colgroup>
      <thead>
        <tr>
          <th>상품명</th>
          <th>가격</th>
          <th>수량</th>
        </tr>
      </thead>
      <tbody id="product-inventory-container">
      </tbody>
    </table>
    `;
  }
}

customElements.define("product-manage", ProductManage);
