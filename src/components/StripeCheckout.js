import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector, useDispatch } from "react-redux";
import { createPaymentIntent } from "../clientRequest/stripe";
import { addOrder, clearUserCart } from "../clientRequest/user";
import { Link } from "react-router-dom";
import { Card } from "antd";
import { DollarOutlined, CheckOutlined } from "@ant-design/icons";
import defaultImg from "../images/default.jpg";

export default function StripeCheckout({ history }) {
  const dispatch = useDispatch();
  const { user, coupon } = useSelector((state) => ({ ...state }));

  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState("");

  const [cartTotal, setCartTotal] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(0);
  const [payable, setPayable] = useState(0);

  const stripe = useStripe();
  const elements = useElements();

  const cartStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: "Arial, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  useEffect(() => {
    createPaymentIntent(user.token, coupon).then((res) => {
      console.log("create payment res", res.data);
      const { clientSecret, cartTotal, totalAfterDiscount, payable } = res.data;
      setClientSecret(clientSecret);
      setCartTotal(cartTotal);
      setTotalAfterDiscount(totalAfterDiscount);
      setPayable(payable);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: e.target.name.value,
        },
      },
    });

    if (payload.error) {
      setError(`Payment failed ${payload.error.message}`);
      setProcessing(false);
    } else {
      // console.log(JSON.stringify(payload, null, 4));

      // create order and save in database for admin to process
      addOrder(payload, user.token).then((res) => {
        if (res.data.ok) {
          // clear local storage
          if (typeof window !== "undefined") {
            localStorage.removeItem("cart");
          }
          // clear redux
          dispatch({
            type: "ADD_TO_CART",
            payload: [],
          });
          dispatch({
            type: "COUPON_APPLIED",
            payload: false,
          });
          // clear backend
          clearUserCart(user.token);
        }
      });
      setError(null);
      setProcessing(false);
      setSucceeded(true);
    }
  };

  const handleChange = async (e) => {
    // listen for changes in the card element
    // and display any errors as the custoemr types their card details
    setDisabled(e.empty); // disable pay button if errors
    setError(e.error ? e.error.message : ""); // show error message
  };

  return (
    <>
      {!succeeded && (
        <div>
          {coupon && totalAfterDiscount !== undefined ? (
            <p className="aler alert-success">{`Total after discount: ${totalAfterDiscount}`}</p>
          ) : (
            <p className="aler alert-danger">No coupon applied</p>
          )}
        </div>
      )}
      <div className="text-center pb-5">
        <Card
          cover={
            <img
              src={defaultImg}
              style={{
                height: "200px",
                objectFit: "cover",
                marginBottom: "-50px",
              }}
            />
          }
          actions={[
            <>
              <DollarOutlined className="text-info" />
              <br />
              Total:$ {cartTotal}
            </>,
            <>
              <CheckOutlined className="text-info" />
              <br />
              Payable:$ {(payable / 100).toFixed(2)}
            </>,
          ]}
        />
      </div>

      <form id="payment-form" className="stripe-form" onSubmit={handleSubmit}>
        <CardElement
          id="card-element"
          options={cartStyle}
          onChange={handleChange}
        />
        <button
          className="stripe-button"
          disabled={processing || disabled || succeeded}
        >
          <span id="button-text">
            {processing ? <div className="spinner" id="spinner"></div> : "Pay"}
          </span>
        </button>
        <br />
        {error && (
          <div className="card-error" role="alert">
            {error}
          </div>
        )}
        <br />
        <p className={succeeded ? "result-message" : "result-message hidden"}>
          Payment Successful.{" "}
          <Link to="/user/history">See it in your purchase history</Link>
        </p>
      </form>
    </>
  );
}
