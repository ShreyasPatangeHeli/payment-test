import { useEffect, useState } from "react";

import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";
import LegacyCheckoutForm from "./LegacyCheckoutForm";

function Payment() {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3053/dev/payment-service/stripe/config").then(async (r) => {
      const d = await r.json();
      const { publishableKey } = d.data
      setStripePromise(loadStripe(publishableKey));
    });
  }, []);


  return (
    <>  
      <h1>React Stripe and the Payment Element</h1>
      { stripePromise && (
        <Elements stripe={stripePromise}>
          {/* <CheckoutForm /> */}
          <LegacyCheckoutForm />
        </Elements>
      )}
    </>
  );
}

export default Payment;
