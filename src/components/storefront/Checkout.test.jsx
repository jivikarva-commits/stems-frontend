import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { CheckoutProvider, PaymentButton } from "./Checkout";
import { trackPurchase } from "../../lib/tracking";
import { trackAccessClick } from "../../lib/storefrontAnalytics";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), {
  virtual: true,
});
jest.mock("../../config/env", () => ({ API: "https://api.example/api" }));
jest.mock("../../lib/tracking", () => ({
  track: jest.fn(),
  trackPurchase: jest.fn(),
}));
jest.mock("../../lib/storefrontAnalytics", () => ({
  trackAccessClick: jest.fn(),
}));
let host, root, options, failure;
const response = (data, ok = true) => ({ ok, json: async () => data });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  sessionStorage.clear();
  jest.clearAllMocks();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  window.Razorpay = jest.fn(function (config) {
    options = config;
    this.open = jest.fn();
    this.on = (_, handler) => {
      failure = handler;
    };
  });
  global.fetch = jest
    .fn()
    .mockResolvedValue(
      response({
        order_id: "order_test",
        token: "test-purchase-token",
        key_id: "test",
        amount: 19900,
        currency: "INR",
      }),
    );
  act(() =>
    root.render(
      <CheckoutProvider>
        <PaymentButton />
      </CheckoutProvider>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  delete window.Razorpay;
});
async function click() {
  await act(async () => {
    host.querySelector("button").click();
  });
}
const payload = {
  razorpay_order_id: "order_test",
  razorpay_payment_id: "pay_test",
  razorpay_signature: "sample-signature",
};
test("all purchase buttons use server-priced Razorpay order", async () => {
  await click();
  expect(trackAccessClick).toHaveBeenCalledTimes(1);
  expect(options.amount).toBe(19900);
  expect(options.order_id).toBe("order_test");
  expect(options.currency).toBe("INR");
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(trackPurchase).not.toHaveBeenCalled();
});
test("verified payment redirects and emits purchase only after server success", async () => {
  await click();
  const receipt = {
    success: true,
    payment_id: "pay_test",
    value: 199,
    currency: "INR",
  };
  fetch.mockResolvedValueOnce(response(receipt));
  await act(async () => options.handler(payload));
  expect(fetch.mock.calls[1][0]).toContain("/verify-payment");
  expect(mockNavigate).toHaveBeenCalledWith("/download");
  expect(trackPurchase).toHaveBeenCalledWith(receipt);
  expect(sessionStorage.getItem("stems_pending_payment")).toBeNull();
});
test("verification failure retains recovery details without download or tracking", async () => {
  await click();
  fetch.mockResolvedValueOnce(
    response({ detail: "Payment not captured" }, false),
  );
  await act(async () => options.handler(payload));
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(trackPurchase).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Retry verification");
  expect(sessionStorage.getItem("stems_pending_payment")).toBeTruthy();
  fetch.mockResolvedValueOnce(
    response({
      success: true,
      payment_id: "pay_test",
      value: 199,
      currency: "INR",
    }),
  );
  await click();
  expect(window.Razorpay).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith("/download");
});
test("cancel and failed payment never unlock download", async () => {
  await click();
  act(() => failure());
  expect(host.textContent).toContain("unsuccessful");
  act(() => options.modal.ondismiss());
  expect(host.textContent).toContain("Checkout closed");
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(trackPurchase).not.toHaveBeenCalled();
});
test("unavailable product shows error and does not open checkout", async () => {
  fetch.mockResolvedValueOnce(
    response({ detail: "Product is being prepared" }, false),
  );
  await click();
  expect(host.textContent).toContain("Product is being prepared");
  expect(window.Razorpay).not.toHaveBeenCalled();
});
