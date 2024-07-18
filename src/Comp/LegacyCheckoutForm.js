import Card from "./Card";
import React, { useEffect, useState } from "react";  
import ReactJson from 'react-json-view'
import { useStripe, useElements , CardNumberElement, CardCvcElement, CardExpiryElement } from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [charge, setCharge] = useState(undefined);
  const [buyerFirstName, setBuyerFirstName] = useState("shreyas");
  const [buyerLastName, setBuyerLastName] = useState("patange");
  const [buyerPhone, setBuyerPhone] = useState("12321321321");
  const [buyerEmail, setBuyerEmail] = useState("shreyas@gmail.com");

  const [purchaseType, setPurchaseType] = useState('MY_SELF');
  const [noOfParticipants, setNoOfParticipants] = useState(1);

  //LOCAL
  const [eventID, setEventID] = useState("01J32JXM4YBA13H0B7EY29XMPE");
  const [currencyID, setCurrencyID] = useState("01J32JQWMXD80QBHXRTQATYNM7");
  const [taxID, setTaxID] = useState("01J338AWEGGTV28ZRHVKPB3M22");
  const [couponCode, setCouponCode] = useState("aaaa");

  //STG
  // const [eventID, setEventID] = useState("01J2V437XP4AXVEHQDH8PBTKPB");
  // const [currencyID, setCurrencyID] = useState("01J32JQWMXD80QBHXRTQATYNM7");
  // const [tax , setTax] = useState(undefined);
  // const [coupon , setCoupon] = useState("01J3317TZJCEERDY2GMRGP3CQD");


  const [event , setEvent] = useState(undefined);
  const [currency , setCurrency] = useState(undefined);
  const [tax , setTax] = useState(undefined);
  const [coupon , setCoupon] = useState(undefined);

  const [customerName, setCustomerName] = useState("shreyas");
  const [customerEmail, setCustomerEmail] = useState("sss@gmail.com");

  useEffect(() => {
    const fetchData = async () => {
      try {
        //Local
        const [event, currency, tax, coupon] = await Promise.all([
          fetch(`http://localhost:3029/dev/event/${eventID}`).then(res => res.json()),
          fetch(`http://localhost:3023/dev/currency/${currencyID}`).then(res => res.json()),
          taxID ? fetch(`http://localhost:3021/dev/tax/${taxID}`).then(res => res.json()) : Promise.resolve(undefined),
          couponCode ? fetch(`http://localhost:3027/dev/coupon/with-code/${couponCode}`).then(res => res.json()) : Promise.resolve(undefined)
        ]);

        //STG
        // const [event,currency, tax, coupon] = await Promise.all([
        //   fetch(`https://zfwppq9jk2.execute-api.us-east-1.amazonaws.com/stg/event/${eventID}`).then(res => res.json()),
        //   fetch(`https://zfwppq9jk2.execute-api.us-east-1.amazonaws.com/stg/currency/${currencyID}`).then(res => res.json()),
        //   taxID ? fetch(`https://zfwppq9jk2.execute-api.us-east-1.amazonaws.com/stg/tax/${taxID}`).then(res => res.json()) : Promise.resolve(undefined),
        //   couponCode ? fetch(`https://zfwppq9jk2.execute-api.us-east-1.amazonaws.com/stg/coupon/${couponCode}`).then(res => res.json()) : Promise.resolve(undefined)
        // ]);
  
        setEvent(event.data.event);
        setCurrency(currency.data.currency);
        setTax(tax?.data?.tax);
        setCoupon(coupon?.data?.coupon);

      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };
  
    fetchData();
  }, [eventID , currencyID, taxID, couponCode]);
  
  

  async function stripeTokenHandler(token) {
    try {

      console.log("event" , event)
      console.log("currency" , currency)
      console.log("tax" , tax)
      console.log("coupon" , coupon)

      const eventAmount = event.eventPrice.filter(price => price.currencyID === currencyID)[0].earlyBirdPrice * 100;
      const totalAmount = eventAmount * noOfParticipants;

      const couponAmount =  couponCode ? coupon.couponType === 'FIXED' ? (coupon.couponAmount * 100) : totalAmount * (coupon.couponAmount / 100) : 0;

      
      const taxPercentage = taxID ? tax.taxPercentage : 0;

      const taxAmount = taxPercentage ? (totalAmount - couponAmount) * (taxPercentage / 100) : 0;

      const calculatedAmount = (totalAmount - couponAmount) + taxAmount;
  
      const orderInfo = {
        calculatedAmount : calculatedAmount,
        noOfParticipants : noOfParticipants,
        eventAmount : eventAmount,
        taxAmount : taxAmount,
        couponAmount : couponAmount
      }
  
      const response = await fetch('http://localhost:3053/dev/payment-service/stripe/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyerFirstName,
          buyerLastName,
          buyerPhone,
          buyerEmail,
  
          purchaseType,
          orderInfo,
  
          eventID,
          currencyID,
          taxID,
          couponID : couponCode ? coupon.id : undefined,
  
          paymentData : {
            token: token.id,
            customerName,
            customerEmail
          }
        }),
      });
      
      const data = await response.json()
      setCharge(data);
      return data;

    } catch (error) {
      console.log(error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const card = elements.getElement(CardNumberElement , CardCvcElement , CardExpiryElement);
    const result = await stripe.createToken(card);

    if (result.error) {
      console.log(result.error.message);
    } else {
      stripeTokenHandler(result.token);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
        <Card />

        Card Holder Name
        <input type="text" name="name" placeholder="Name" 
              value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        <br />
        
        Card Holder Email
        <input type="email" name="email" placeholder="Email" 
              value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />

        <button type="submit" disabled={!stripe}>Confirm order</button>
    </form>

    <h2>Charge</h2>
    {
      charge && <ReactJson src={event} />
    }

    </>

  );
}
