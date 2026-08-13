declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutConfig {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_modal' | string;
  }

  export interface CashfreeInstance {
    checkout(config: CashfreeCheckoutConfig): Promise<any>;
  }

  export function load(config: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
