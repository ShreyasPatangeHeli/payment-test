import React from 'react';
import {CardNumberElement , CardExpiryElement , CardCvcElement} from '@stripe/react-stripe-js';
import './Card.css';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};
function Card() {
  return (
    <label>
      Card details
      <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
      Expiration date
      <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
      CVC
      <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
    </label>
  );
};
export default Card;