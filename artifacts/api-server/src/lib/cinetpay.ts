import axios from "axios";

const CINETPAY_BASE = "https://api-checkout.cinetpay.com/v2";

export interface CinetPayInitParams {
  transactionId: string;
  amount: number;
  currency?: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  channels?: string;
}

export const initCinetPayPayment = async (params: CinetPayInitParams) => {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) throw new Error("CINETPAY_NOT_CONFIGURED");

  const domain = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.APP_URL || "http://localhost:8080";

  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.transactionId,
    amount: Math.round(params.amount),
    currency: params.currency || "XOF",
    alternative_currency: "",
    description: params.description,
    customer_name: params.customerName || "Client CryptoXchange",
    customer_email: params.customerEmail || "client@cryptoxchange.com",
    customer_phone_number: params.customerPhone || "",
    customer_address: "",
    customer_city: "Abidjan",
    customer_country: "CI",
    customer_state: "CI",
    customer_zip_code: "00225",
    notify_url: `${domain}/api/v1/payments/webhook/cinetpay`,
    return_url: `${domain}/dashboard/deposit?status=success`,
    channels: params.channels || "ALL",
    metadata: params.transactionId,
    lang: "FR",
    invoice_data: {},
  };

  const { data } = await axios.post<any>(`${CINETPAY_BASE}/payment/`, payload);

  if (data.code !== "201") {
    throw new Error(`CinetPay: ${data.message}`);
  }

  return {
    paymentUrl: data.data.payment_url as string,
    paymentToken: data.data.payment_token as string,
  };
};

export const checkCinetPayPayment = async (transactionId: string) => {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) throw new Error("CINETPAY_NOT_CONFIGURED");

  const { data } = await axios.post<any>(`${CINETPAY_BASE}/payment/check/`, {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: transactionId,
  });

  return {
    status: (data.data?.status as string) || "PENDING",
    amount: Number(data.data?.amount) || 0,
    operator: (data.data?.operator_id as string) || "",
  };
};
