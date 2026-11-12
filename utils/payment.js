const crypto = require("crypto");

/**
 * Demo payment module.
 *
 * This simulates a payment gateway so the booking flow works end-to-end
 * without any real gateway credentials. To go live, replace `processPayment`
 * with a Stripe/Razorpay charge and keep the same return shape:
 *   { success: true, transactionId, cardLast4?, method }
 *   { success: false, message }
 */

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

const isCardNumberValid = (value) => {
    const digits = onlyDigits(value);
    return digits.length >= 13 && digits.length <= 19;
};

const isExpiryValid = (value) => {
    const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(value || "").trim());
    if(!match) return false;

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if(month < 1 || month > 12) return false;

    // First day of the month after expiry: the card is valid through the expiry month
    const expiryBoundary = new Date(year, month, 1);
    return expiryBoundary > new Date();
};

const isUpiValid = (value) => /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/.test(String(value || "").trim());

const buildTransactionId = () => {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `HMS-${stamp}-${random}`;
};

const failure = (message) => ({ success: false, message });

const processPayment = async ({ method, amount, details = {} }) => {
    if(!Number.isFinite(amount) || amount <= 0){
        return failure("Invalid payment amount.");
    }

    if(method === "card"){
        if(!String(details.cardName || "").trim()){
            return failure("Please enter the cardholder name.");
        }
        if(!isCardNumberValid(details.cardNumber)){
            return failure("Enter a valid card number.");
        }
        if(!isExpiryValid(details.cardExpiry)){
            return failure("Enter a valid future expiry date (MM/YY).");
        }

        const cvv = onlyDigits(details.cardCvv);
        if(cvv.length < 3 || cvv.length > 4){
            return failure("Enter a valid CVV.");
        }

        const digits = onlyDigits(details.cardNumber);
        if(digits.endsWith("0000")){
            return failure("Your card was declined. Please try a different card.");
        }

        return {
            success: true,
            method,
            transactionId: buildTransactionId(),
            cardLast4: digits.slice(-4),
        };
    }

    if(method === "upi"){
        if(!isUpiValid(details.upiId)){
            return failure("Enter a valid UPI ID (for example name@bank).");
        }

        return {
            success: true,
            method,
            transactionId: buildTransactionId(),
        };
    }

    if(method === "netbanking"){
        if(!String(details.bankName || "").trim()){
            return failure("Please choose your bank.");
        }

        return {
            success: true,
            method,
            transactionId: buildTransactionId(),
        };
    }

    return failure("Please choose a payment method.");
};

module.exports = { processPayment };
