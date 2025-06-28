import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
let outgoingpaymentgrantaccessToken:string|undefined;
import {
  createIncomingPayment,
  createOutgoingPayment,
  createQuote,
  getAuthenticatedClient,
  createOutgoingPaymentPendingGrant,
  getWalletAddressInfo,
  processSubscriptionPayment,
} from "./open-payments";

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// In-memory data stores (replace with database in production)
const quoteCache = new Map<string, {
  quote: any;
  grantExpiry: Date;
  incomingPaymentUrl: string;
}>();

const customers = new Map<string, {
  id: string;
  name: string;
  walletAddress: string;
  createdAt: string;
}>();

const vendors = new Map<string, {
  id: string;
  name: string;
  walletAddress: string;
  createdAt: string;
}>();

const grants = new Map<string, {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName: string;
  dailyLimit: number;
  spentToday: number;
  expiresAt: string;
  createdAt: string;
  grantData: {
    continueAccessToken: string;
    continueUri: string;
    interactRef?: string;
    senderWalletAddress: string;
  };
  status: string;
}>();

// Sample data for testing
customers.set("customer1", {
  id: "customer1",
  name: "John Doe",
  walletAddress: "https://ilp.interledger-test.dev/alice",
  createdAt: new Date().toISOString()
});

vendors.set("vendor1", {
  id: "vendor1",
  name: "Coffee Shop",
  walletAddress: "https://ilp.interledger-test.dev/bob",
  createdAt: new Date().toISOString()
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// ============== ENDPOINTS ==============

// NEW ENDPOINT 1: Start payment session
app.post("/api/start-payment-session", async (req: Request, res: Response): Promise<any> => {
  const { clientSessionId, senderWalletAddress, receiverWalletAddress, amount } = req.body;
  
  if (!clientSessionId || !senderWalletAddress || !receiverWalletAddress || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await getAuthenticatedClient();

    // Get receiver wallet info
    const { walletAddressDetails: receiverDetails } = await getWalletAddressInfo(client, receiverWalletAddress);

    // Create incoming payment
    const incomingPayment = await createIncomingPayment(client, amount, receiverDetails);

    // Get sender wallet info
    const { walletAddressDetails: senderDetails } = await getWalletAddressInfo(client, senderWalletAddress);

    // Create quote
    const quote = await createQuote(client, incomingPayment.id, senderDetails);

    // Save quote info and expiry in cache
    const expiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    quoteCache.set(clientSessionId, {
      quote,
      grantExpiry: expiry,
      incomingPaymentUrl: incomingPayment.id,
    });

    return res.status(200).json({
      quote,
      incomingPaymentUrl: incomingPayment.id,
      grantExpiry: expiry.toISOString(),
    });
  } catch (error) {
    console.error("Error in start-payment-session:", error);
    return res.status(500).json({ error: "Failed to start payment session" });
  }
});

app.post("/api/approve-payment", async (req: Request, res: Response): Promise<any> => {
  const { clientSessionId, senderWalletAddress, continueAccessToken, interactRef, continueUri } = req.body;
  
  if (!clientSessionId || !senderWalletAddress || !continueAccessToken || !interactRef || !continueUri) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const client = await getAuthenticatedClient();

    // Check cached quote grant
    const cached = quoteCache.get(clientSessionId);
    if (!cached) {
      return res.status(400).json({ error: "No payment session found" });
    }

    // Check expiry
    if (cached.grantExpiry < new Date()) {
      return res.status(400).json({ error: "Quote grant expired, please restart payment" });
    }

    // Get wallet details for sender
    const { walletAddressDetails: senderDetails } = await getWalletAddressInfo(client, senderWalletAddress);

    // Create outgoing payment using the continued grant info
    const outgoingPayment = await createOutgoingPayment(
      client,
      {
        senderWalletAddress,
        continueAccessToken,
        quoteId: cached.quote.id,
        interactRef,
        continueUri,
      },
      senderDetails
    );

    // Clear cache
    quoteCache.delete(clientSessionId);

    return res.status(200).json({ outgoingPayment });
  } catch (error) {
    console.error("Error in approve-payment:", error);
    return res.status(500).json({ error: "Failed to approve payment" });
  }
});

app.post(
  "/api/create-incoming-payment",
  async (req: Request, res: Response): Promise<any> => {
    const { senderWalletAddress, receiverWalletAddress, amount } = req.body;

    if (!senderWalletAddress || !receiverWalletAddress || !amount) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please fill in all the required fields",
        received: req.body,
      });
    }

    try {
      const client = await getAuthenticatedClient();

      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        receiverWalletAddress
      );

      const incomingPayment = await createIncomingPayment(
        client,
        amount,
        walletAddressDetails
      );
      return res.status(200).json({ data: incomingPayment });
    } catch (err: any) {
      console.error("Error creating incoming payment:", err);
      return res
        .status(500)
        .json({ error: "Failed to create incoming payment" });
    }
  }
);

app.post(
  "/api/create-quote",
  async (req: Request, res: Response): Promise<any> => {
    const { senderWalletAddress, incomingPaymentUrl } = req.body;

    if (!senderWalletAddress || !incomingPaymentUrl) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please fill in all the required fields",
        received: req.body,
      });
    }

    try {
      const client = await getAuthenticatedClient();

      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        senderWalletAddress
      );

      const quote = await createQuote(
        client,
        incomingPaymentUrl,
        walletAddressDetails
      );
      return res.status(200).json({ data: quote });
    } catch (err: any) {
      console.error("Error creating quote:", err);
      return res
        .status(500)
        .json({ error: "Failed to create quote" });
    }
  }
);

app.post(
  "/api/outgoing-payment-auth",
  async (req: Request, res: Response): Promise<any> => {
    const {
      senderWalletAddress,
      quoteId,
      debitAmount,
      receiveAmount,
      type,
      payments,
      redirectUrl,
      duration,
    } = req.body;

    if (!senderWalletAddress || !quoteId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please fill in all the required fields",
        received: req.body,
      });
    }

    try {
      const client = await getAuthenticatedClient();

      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        senderWalletAddress
      );

      const outgoingPaymentAuthResponse =
        await createOutgoingPaymentPendingGrant(
          client,
          {
            quoteId,
            debitAmount,
            receiveAmount,
            type,
            payments,
            redirectUrl,
            duration,
          },
          walletAddressDetails
        );
      return res.status(200).json({ data: outgoingPaymentAuthResponse });
    } catch (err: any) {
      console.error("Error creating outgoing payment auth:", err);
      return res
        .status(500)
        .json({ error: "Failed to create outgoing payment auth" });
    }
  }
);

app.post(
  "/api/outgoing-payment",
  async (req: Request, res: Response): Promise<any> => {
    const {
      senderWalletAddress,
      continueAccessToken,
      quoteId,
      interactRef,
      continueUri,
    } = req.body;

    if (!senderWalletAddress || !quoteId) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please fill in all the required fields",
        received: req.body,
      });
    }

    try {
      const client = await getAuthenticatedClient();

      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        senderWalletAddress
      );

      const outgoingPaymentResponse = await createOutgoingPayment(
        client,
        {
          senderWalletAddress,
          continueAccessToken,
          quoteId,
          interactRef,
          continueUri,
        },
        walletAddressDetails
      );

      return res.status(200).json({ data: outgoingPaymentResponse });
    } catch (err: any) {
      console.error("Error creating outgoing payment:", err);
      return res
        .status(500)
        .json({ error: "Failed to create outgoing payment" });
    }
  }
);

app.post(
  "/api/subscription-payment",
  async (req: Request, res: Response): Promise<any> => {
    const { receiverWalletAddress, manageUrl, previousToken } = req.body;

    if (!receiverWalletAddress || !manageUrl) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Please fill in all the required fields",
        received: req.body,
      });
    }

    try {
      const client = await getAuthenticatedClient();

      const outgoingPaymentResponse = await processSubscriptionPayment(client, {
        receiverWalletAddress,
        manageUrl,
        previousToken,
      });

      return res.status(200).json({ data: outgoingPaymentResponse });
    } catch (err: any) {
      console.error("Error processing subscription payment:", err);
      return res
        .status(500)
        .json({ error: "Failed to process subscription payment" });
    }
  }
);

// NEW ENDPOINT 2: Authorize vendor for customer
app.post(
  "/api/customers/:customerId/authorize-vendor",
  async (req: Request, res: Response): Promise<any> => {
    const { customerId } = req.params;
    const { vendorId, spendingLimit, redirectUrl } = req.body;

    // Validate inputs
    if (!vendorId || !spendingLimit || !redirectUrl) {
      return res.status(400).json({
        error: "Validation failed",
        message: "vendorId, spendingLimit, and redirectUrl are required"
      });
    }

    // Look up customer
    const customer = customers.get(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Look up vendor
    const vendor = vendors.get(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    try {
      // Authenticate with Open Payments client
      const client = await getAuthenticatedClient();

      // Get customer's wallet details
      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        customer.walletAddress
      );

      // Request pending grant (repeated payments up to spendingLimit)
      const pendingGrant = await createOutgoingPaymentPendingGrant(
        client,
        {
          debitAmount: {
            value: (spendingLimit * 100).toString(), // e.g. 50 ZAR => 5000
            assetCode: "ZAR",
            assetScale: 2
          },
          receiveAmount: {
            value: (spendingLimit * 100).toString(),
            assetCode: "ZAR",
            assetScale: 2
          },
          type: "multi-payment", // just descriptive for your side
          redirectUrl
        },
        walletAddressDetails
      );

      // Store this grant in your grants map
      const grantId = uuidv4();
      const expires = new Date();
      expires.setDate(expires.getDate() + 30); // expires in 30 days

      grants.set(grantId, {
        id: grantId,
        customerId,
        vendorId,
        vendorName: vendor.name,
        dailyLimit: spendingLimit,
        spentToday: 0,
        expiresAt: expires.toISOString(),
        createdAt: new Date().toISOString(),
        grantData: {
          continueAccessToken: pendingGrant.continue.access_token.value,
          continueUri: pendingGrant.continue.uri,
          interactRef: undefined,
          senderWalletAddress: customer.walletAddress
        },
        status: "active"
      });

      // Respond with info to show user or embed in QR
      return res.status(201).json({
        success: true,
        grantId,
        vendor: {
          id: vendor.id,
          name: vendor.name
        },
        spendingLimit,
        expiresAt: expires.toISOString(),
        authorizationUrl: pendingGrant.interact?.redirect
      });
    } catch (err: any) {
      console.error("Error creating vendor grant:", err);
      return res.status(500).json({
        error: "Failed to authorize vendor",
        message: err.message
      });
    }
  }
);

// NEW ENDPOINT 3: Create vendor grant
app.post(
  "/api/create-vendor-grant",
  async (req: Request, res: Response): Promise<any> => {
    const { customerWalletAddress, vendorWalletAddress, spendingLimit, redirectUrl } = req.body;

    if (!customerWalletAddress || !vendorWalletAddress || !spendingLimit || !redirectUrl) {
      return res.status(400).json({
        error: "Validation failed",
        message: "customerWalletAddress, vendorWalletAddress, spendingLimit, and redirectUrl are required",
        received: req.body
      });
    }

    try {
      // Initialize Open Payments client
      const client = await getAuthenticatedClient();

      // Get customer wallet details (this is where spending limit will be authorized)
      const { walletAddressDetails } = await getWalletAddressInfo(
        client,
        customerWalletAddress
      );

      // Request pending grant for repeated payments with total spending limit
      const pendingGrant = await createOutgoingPaymentPendingGrant(
        client,
        {
          debitAmount: {
            //value: (spendingLimit * 100).toString(), // e.g. 100 ZAR = 10000
            value: (spendingLimit * 10 ** walletAddressDetails.assetScale).toString(),
            assetCode: walletAddressDetails.assetCode,
            assetScale: walletAddressDetails.assetScale
            
          },
          type: "multi-payment",
          redirectUrl
        },
        walletAddressDetails
      );

      return res.status(201).json({
        success: true,
        authorizationUrl: pendingGrant.interact?.redirect,
        continueAccessToken: pendingGrant.continue.access_token.value,
        continueUri: pendingGrant.continue.uri
      });
    } catch (err: any) {
      console.error("Error creating vendor grant:", err);
      return res.status(500).json({
        error: "Failed to create vendor grant",
        message: err.message
      });
    }
  }
);

// NEW ENDPOINT 4: Process payment
app.post(
  "/api/process-payment",
  async (req: Request, res: Response): Promise<any> => {
    const {
      customerWalletAddress,
      receiverWalletAddress,
      continueAccessToken,
      continueUri,
      interactRef,
      spendAmount
    } = req.body;
    console.log("process payement here",req.body) 

    if (!receiverWalletAddress || !continueAccessToken || !continueUri || !spendAmount) {
      return res.status(400).json({
        error: "Validation failed",
        message: "receiverWalletAddress, continueAccessToken, continueUri and spendAmount are required",
        received: req.body
      });
    }

    try {
      const client = await getAuthenticatedClient();

      // Get wallet details for the vendor who will receive the money
      const { walletAddressDetails: receiverWalletDetails } = await getWalletAddressInfo(
        client,
        receiverWalletAddress
      );

      // Get customer wallet details if provided
      let customerWalletDetails;
      if (customerWalletAddress) {
        const result = await getWalletAddressInfo(client, customerWalletAddress);
        customerWalletDetails = result.walletAddressDetails;
      }

      // Continue the grant (rotates the token) for new outgoing payment authorization
      if (! outgoingpaymentgrantaccessToken){
      const grant = await client.grant.continue(
        {
          accessToken: continueAccessToken,
          url: continueUri
        },
        {
          interact_ref: interactRef
        }
      );
      outgoingpaymentgrantaccessToken= (grant as any).access_token.value
    };

      // Create incoming payment on vendor side
      const incomingPayment = await createIncomingPayment(
        client,
        (spendAmount * 100).toString(),
        receiverWalletDetails
      );

      console.log("** got here 44")
      // Create quote from customer's wallet to this incoming payment
      // Use customer wallet details if available, otherwise use receiver details
      const walletForQuote = customerWalletDetails || receiverWalletDetails;
      const quote = await createQuote(
        client,
        incomingPayment.id,
        walletForQuote
      );

      // Create outgoing payment
      const outgoingPayment = await client.outgoingPayment.create(
        {
          url: customerWalletDetails!.resourceServer,
          accessToken: outgoingpaymentgrantaccessToken!
        },
        {
        debitAmount:{assetCode:customerWalletDetails!.assetCode,assetScale:customerWalletDetails!.assetScale,value:(spendAmount*100).toString()},
          walletAddress: customerWalletDetails!.id,
          incomingPayment: incomingPayment.id
        }
      );

      return res.status(201).json({
        success: true,
        incomingPayment,
        quote,
        outgoingPayment,
        newAccessToken: outgoingpaymentgrantaccessToken
      });

    } catch (err: any) {
      console.error("Error processing payment:", err);
      return res.status(500).json({
        error: "Failed to process payment",
        message: err.message
      });
    }
  }
);

// Helper endpoints for testing
app.get("/api/customers", (req: Request, res: Response) => {
  const customerList = Array.from(customers.values());
  res.json({ customers: customerList });
});

app.get("/api/vendors", (req: Request, res: Response) => {
  const vendorList = Array.from(vendors.values());
  res.json({ vendors: vendorList });
});

app.get("/api/grants", (req: Request, res: Response) => {
  const grantList = Array.from(grants.values());
  res.json({ grants: grantList });
});

// ============== ERROR HANDLING ==============

// 404
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      "GET /",
      "GET /api/health",
      "POST /api/start-payment-session",
      "POST /api/approve-payment",
      "POST /api/create-incoming-payment",
      "POST /api/create-quote",
      "POST /api/outgoing-payment-auth",
      "POST /api/outgoing-payment",
      "POST /api/subscription-payment",
      "POST /api/customers/:customerId/authorize-vendor",
      "POST /api/create-vendor-grant",
      "POST /api/process-payment"
    ],
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log("\n📋 Available endpoints:");
  console.log("  POST   /api/start-payment-session        - Start a payment session with quote caching");
  console.log("  POST   /api/approve-payment              - Approve a cached payment session");
  console.log("  POST   /api/create-incoming-payment      - Create incoming payment resource");
  console.log("  POST   /api/create-quote                 - Create quote resource");
  console.log("  POST   /api/outgoing-payment-auth        - Get continuation grant for outgoing payment");
  console.log("  POST   /api/outgoing-payment             - Create outgoing payment resource");
  console.log("  POST   /api/subscription-payment         - Process subscription payment");
  console.log("  POST   /api/customers/:id/authorize-vendor - Authorize vendor for customer");
  console.log("  POST   /api/create-vendor-grant          - Create vendor grant");
  console.log("  POST   /api/process-payment              - Process payment with existing grant");
  console.log("  GET    /api/customers                    - List all customers");
  console.log("  GET    /api/vendors                      - List all vendors");
  console.log("  GET    /api/grants                       - List all grants");
});

export default app;