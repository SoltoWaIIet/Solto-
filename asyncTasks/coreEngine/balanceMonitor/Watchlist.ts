interface WatchItem {
  mint: string
  addedAt: string
  alertThreshold: number
}

export class Watchlist {
  private items: WatchItem[] = []

  add(mint: string, threshold: number = 100): void {
    this.items.push({
      mint,
      addedAt: new Date().toISOString(),
      alertThreshold: threshold
    })
  }

  remove(mint: string): void {
    this.items = this.items.filter(i => i.mint !== mint)
  }

  check(mint: string): WatchItem | undefined {
    return this.items.find(i => i.mint === mint)
  }

  list(): WatchItem[] {
    return this.items
  }
}
