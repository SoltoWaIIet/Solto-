export async function valuateTokenHoldings(
  balance: number,
  usdPrice: number
): Promise<{ valueUSD: number; rounded: string }> {
  const value = balance * usdPrice
  return {
    valueUSD: value,
    rounded: `$${value.toFixed(2)}`
  }
}
