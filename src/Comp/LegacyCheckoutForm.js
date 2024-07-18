import Card from "./Card";
import React, { useEffect, useState } from "react";  
import { useStripe, useElements , CardNumberElement, CardCvcElement, CardExpiryElement } from "@stripe/react-stripe-js";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [buyerFirstName, setBuyerFirstName] = useState("shreyas");
  const [buyerLastName, setBuyerLastName] = useState("patange");
  const [buyerPhone, setBuyerPhone] = useState("12321321321");
  const [buyerEmail, setBuyerEmail] = useState("shreyas@gmail.com");

  const [purchaseType, setPurchaseType] = useState('MY_SELF');
  const [noOfParticipants, setNoOfParticipants] = useState(1);

  const [eventID, setEventID] = useState("01J32JXM4YBA13H0B7EY29XMPE");
  const [courseID, setCourseID] = useState("01J32JPCRYPH75VNYB6BYTKZ6X");
  const [currencyID, setCurrencyID] = useState("01J32JQWMXD80QBHXRTQATYNM7");
  const [taxID, setTaxID] = useState(undefined);
  const [couponID, setCouponID] = useState(undefined);

  const [event , setEvent] = useState(undefined);
  const [course , setCourse] = useState(undefined);
  const [currency , setCurrency] = useState(undefined);
  const [tax , setTax] = useState(undefined);
  const [coupon , setCoupon] = useState(undefined);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [event, course, currency, tax, coupon] = await Promise.all([
          fetch(`http://localhost:3029/dev/event/${eventID}`).then(res => res.json()),
          fetch(`http://localhost:3019/dev/course/${courseID}`).then(res => res.json()),
          fetch(`http://localhost:3023/dev/currency/${currencyID}`).then(res => res.json()),
          taxID ? fetch(`http://localhost:3021/dev/tax/${taxID}`).then(res => res.json()) : Promise.resolve(undefined),
          couponID ? fetch(`http://localhost:3027/dev/coupon/${couponID}`).then(res => res.json()) : Promise.resolve(undefined)
        ]);
  
        setEvent(event.data.event);
        setCourse(course.data.course);
        setCurrency(currency.data.currency);
        setTax(tax?.data);
        setCoupon(coupon?.data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };
  
    fetchData();
  }, [eventID, courseID, currencyID, taxID, couponID]);
  
  

  async function stripeTokenHandler(token) {
    try {

      console.log(event)
      console.log(course)
      console.log(currency)

      const eventAmount = event.eventPrice.filter(price => price.currencyID === currencyID)[0].earlyBirdPrice * 100;
      const totalAmount = eventAmount * noOfParticipants;
      const couponAmount =  couponID ? coupon.couponType === 'FIXED' ? (coupon.couponAmount * 100) : totalAmount * coupon.couponAmount : 0;
      const taxPercentage = taxID ? tax.taxPercentage : 0;

      const taxAmount = (totalAmount - couponAmount) * taxPercentage;


      const calculatedAmount = (totalAmount - couponAmount) + taxAmount;
  
      const orderInfo = {
        calculatedAmount : calculatedAmount,
        noOfParticipants : noOfParticipants,
        eventAmount : eventAmount,
        taxAmount : taxAmount,
        couponAmount : couponAmount
      }
  
      console.log({
        buyerFirstName,
        buyerLastName,
        buyerPhone,
        buyerEmail,
  
        purchaseType,
        orderInfo,
  
        eventID,
        courseID,
        currencyID,
        taxID,
        couponID,
  
        paymentData : {
          token: token.id,
          customerName,
          customerEmail
        }
      })
  
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
          courseID,
          currencyID,
          taxID,
          couponID,
  
          paymentData : {
            token: token.id,
            customerName,
            customerEmail
          }
        }),
      });
    
      return response.json();

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
  );
}
