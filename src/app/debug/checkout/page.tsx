// Debug page to test Razorpay checkout with explicit test handling
import { razorpay } from "@/lib/razorpay";

export default async function DebugCheckoutPage() {
  // Create a test order server-side
  const order = await razorpay.orders.create({
    amount: 100, // ₹1 in paise
    currency: "INR",
    receipt: "debug_checkout_" + Date.now(),
  });

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  return (
    <html>
      <head>
        <title>Razorpay Debug Checkout</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>Razorpay Debug Checkout</h1>
        <p><strong>Key ID:</strong> {keyId}</p>
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Amount:</strong> ₹{(order.amount as number) / 100}</p>
        
        <hr style={{ margin: "1rem 0" }} />
        
        <h2>Test Cards (should work in test mode):</h2>
        <ul>
          <li><strong>Card:</strong> 4111 1111 1111 1111 (any future expiry, any CVV)</li>
          <li><strong>UPI:</strong> success@razorpay</li>
        </ul>

        <hr style={{ margin: "1rem 0" }} />

        <button
          id="pay-btn"
          style={{
            padding: "1rem 2rem",
            fontSize: "1rem",
            backgroundColor: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Open Checkout
        </button>

        <div id="result" style={{ marginTop: "1rem" }}></div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('pay-btn').onclick = function() {
                var options = {
                  key: "${keyId}",
                  amount: ${order.amount},
                  currency: "INR",
                  order_id: "${order.id}",
                  name: "Test Checkout",
                  description: "Debug Payment",
                  handler: function(response) {
                    document.getElementById('result').innerHTML = 
                      '<pre style="background:#e0ffe0;padding:1rem;border-radius:0.5rem;">' + 
                      JSON.stringify(response, null, 2) + '</pre>';
                  },
                  modal: {
                    ondismiss: function() {
                      document.getElementById('result').innerHTML = 
                        '<p style="color:orange;">Checkout closed</p>';
                    }
                  }
                };
                
                console.log("Razorpay options:", options);
                console.log("Key prefix:", "${keyId}".substring(0, 8));
                
                var rzp = new Razorpay(options);
                rzp.open();
              };
            `,
          }}
        />
      </body>
    </html>
  );
}
