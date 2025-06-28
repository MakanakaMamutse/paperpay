import dotenv from "dotenv";
import {
  AuthenticatedClient,
  Grant,
  IncomingPayment,
  PendingGrant,
  WalletAddress,
  isPendingGrant,
} from "@interledger/open-payments";
import { randomUUID, createHash } from "crypto";
import { Cache } from "./cache";

dotenv.config({ path: ".env" });

interface Amount {
  value: string;
  assetCode: string;
  assetScale: number;
}

interface TokenInfo {
  accessToken: string;
  manageUrl: string;
}

export class OpenPayments {
  constructor(private opClient: AuthenticatedClient, private cache: Cache) {}

  /**
   * Setup Instant Pay Payment Authorization
   * Creates a long-lived grant that can be used for instant payments - token and mangageUrl must be persisted
   */
  async setupInstantPay(
    walletAddressUrl: string,
    maxAmount: number
  ): Promise<string> {
    // Get wallet address information
    const walletAddress = await this.opClient.walletAddress.get({
      url: walletAddressUrl,
    });

    // Generate unique identifiers for this authorization
    const clientNonce = randomUUID();
    const clientIdentifier = randomUUID();

    // Convert amount to the wallet's asset scale
    const amountData: Amount = {
      value: (maxAmount * 10 ** walletAddress.assetScale).toFixed(),
      assetCode: walletAddress.assetCode,
      assetScale: walletAddress.assetScale,
    };

    // Request a grant for outgoing payments with spending limits
    const grant = await this.opClient.grant.request(
      { url: walletAddress.authServer },
      {
        access_token: {
          access: [
            {
              type: "outgoing-payment",
              actions: ["create", "read", "list"],
              identifier: walletAddress.id,
              limits: {
                debitAmount: amountData,
              },
            },
          ],
        },
        interact: {
          start: ["redirect"],
          finish: {
            method: "redirect",
            uri: ⁠ ${process.env.FRONTEND_URL}/instant-pay/finish?identifier=${clientIdentifier} ⁠,
            nonce: clientNonce,
          },
        },
      }
    );

    if (!isPendingGrant(grant)) {
      throw new Error("Expected interactive grant for instant-pay setup");
    }

    // Cache the grant information for later use (expires in 5 minutes)
    this.cache.set(
      clientIdentifier,
      {
        walletAddressUrl: walletAddress.id,
        clientNonce,
        interactNonce: grant.interact.finish,
        continueUri: grant.continue.uri,
        continueToken: grant.continue.access_token.value,
      },
      300
    ); // 5 minutes TTL

    // Return the redirect URL for user authorization
    return grant.interact.redirect;
  }

  /**
   * Step 2: Complete the Authorization Flow
   * Called after user returns from wallet authorization
   */
  async completeInstantPaySetup(
    identifier: string,
    interactRef: string,
    hash: string
  ): Promise<TokenInfo> {
    const InstantPayData = this.cache.get(identifier);

    // Verify the hash to ensure the interaction is authentic
    await this.verifyInteractionHash({
      interactRef,
      receivedHash: hash,
      clientNonce: InstantPayData.clientNonce,
      interactNonce: InstantPayData.interactNonce,
      walletAddressUrl: InstantPayData.walletAddressUrl,
    });

    // Continue the grant to get the final access token
    return await this.continueGrant({
      accessToken: InstantPayData.continueToken,
      url: InstantPayData.continueUri,
      interactRef,
    });
  }

  /**
   * Step 3: Make Instant Payment
   * Use the stored token to make payments without user interaction
   */
  async makeInstantPayment(
    accessToken: string,
    manageUrl: string,
    vendorPaymentPointer: string,
    senderPaymentPointer: string,
    amount: number,
    description: string
  ): Promise<void> {
    // Get sender's wallet address
    const senderWallet = await this.opClient.walletAddress.get({
      url: senderPaymentPointer,
    });

    // Get vendor's wallet address
    const vendorWallet = await this.opClient.walletAddress.get({
      url: vendorPaymentPointer,
    });

    // Create incoming payment at receiver
    const incomingPayment = await this.createVendorIncomingPayment(
      vendorWallet,
      amount,
      description
    );

    // Rotate the token to ensure it's fresh
    const freshGrant = await this.opClient.token.rotate({
      accessToken,
      url: manageUrl,
    });

    // Create the outgoing payment
    await this.opClient.outgoingPayment
      .create(
        {
          url: senderWallet.id,
          accessToken: freshGrant.access_token.value,
        },
        {
          walletAddress: senderWallet.id,
          incomingPayment: incomingPayment.id,
          debitAmount: {
            assetCode: senderWallet.assetCode,
            assetScale: senderWallet.assetScale,
            value: (amount * 10 ** senderWallet.assetScale).toString(),
          },
          metadata: {
            description,
            type: "instant",
          },
        }
      )
      .catch(() => {
        throw new Error(
          "One click buy spending limit exceeded. Please setup one click buy again."
        );
      });
  }

  /**
   * Helper: Continue a pending grant
   */
  private async continueGrant(params: {
    accessToken: string;
    url: string;
    interactRef: string;
  }): Promise<TokenInfo> {
    const continuation = await this.opClient.grant.continue(
      {
        accessToken: params.accessToken,
        url: params.url,
      },
      {
        interact_ref: params.interactRef,
      }
    );

    if (!this.isGrant(continuation)) {
      throw new Error("Expected grant response");
    }

    return {
      accessToken: continuation.access_token.value,
      manageUrl: continuation.access_token.manage,
    };
  }

  /**
   * Helper: Verify interaction hash for security
   */
  private async verifyInteractionHash(params: {
    interactRef: string;
    receivedHash: string;
    clientNonce: string;
    interactNonce: string;
    walletAddressUrl: string;
  }): Promise<void> {
    const walletAddress = await this.opClient.walletAddress.get({
      url: params.walletAddressUrl,
    });

    const data = ⁠ ${params.clientNonce}\n${params.interactNonce}\n${params.interactRef}\n${walletAddress.authServer}/ ⁠;
    const calculatedHash = createHash("sha-256").update(data).digest("base64");

    if (calculatedHash !== params.receivedHash) {
      throw new Error("Hash verification failed");
    }
  }

  /**
   * Create a quote for a payment
   */
  private async createQuote(walletAddress: any, receiver: string) {
    // First get a quote grant
    const quoteGrant = await this.opClient.grant.request(
      { url: walletAddress.authServer },
      {
        access_token: {
          access: [
            {
              type: "quote",
              actions: ["create", "read"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(quoteGrant)) {
      throw new Error("Expected non-interactive quote grant");
    }

    // Create the quote
    return await this.opClient.quote.create(
      {
        url: walletAddress.resourceServer,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: "ilp",
        walletAddress: walletAddress.id,
        receiver,
      }
    );
  }

  /**
   *  Type guard for grants
   */
  private isGrant(continuation: any): continuation is Grant {
    return continuation.access_token !== undefined;
  }

  /**
   *  Request grant for new incoming payment
   */
  private async createVendorIncomingPayment(
    vendorWallet: WalletAddress,
    amount: number,
    description: string
  ): Promise<IncomingPayment> {
    // Request grant for incoming payment on vendor
    const grant: Grant | PendingGrant = await this.opClient.grant.request(
      { url: vendorWallet.id },
      {
        access_token: {
          access: [
            {
              type: "incoming-payment",
              actions: ["read-all", "create"],
            },
          ],
        },
      }
    );

    if (isPendingGrant(grant)) {
      throw new Error("Expected non-interactive grant for incoming payment");
    }

    const incomingPayment = await this.opClient.incomingPayment.create(
      {
        url: vendorWallet.id,
        accessToken: grant.access_token.value,
      },
      {
        walletAddress: vendorWallet.id,
        incomingAmount: {
          assetCode: vendorWallet.assetCode,
          assetScale: vendorWallet.assetScale,
          value: (amount * 10 ** vendorWallet.assetScale).toFixed(),
        },
        metadata: { description },
      }
    );

    return incomingPaymen