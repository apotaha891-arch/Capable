// Retail prices we charge the customer (USD/year) for a domain purchased
// through Capable. Set above ResellerClub's base-slab wholesale cost (~$10-12/yr
// for .com — see https://www.resellerclub.com/domain-reseller/pricing) to keep a
// margin; the slab price drops as our reseller volume grows, so this margin
// widens over time without a code change.
//
// No Saudi/UAE ccTLDs (.sa/.ae, etc.) — those registries require local-presence
// verification (a Saudi commercial registration for .sa, a UAE trade license for
// .ae) that a generic global reseller API cannot satisfy. A customer who needs
// one of those still uses the "buy externally" link.
export const DOMAIN_TLD_PRICING = {
  com:    { retail: 14.99, label: '.com' },
  net:    { retail: 15.99, label: '.net' },
  store:  { retail: 16.99, label: '.store' },
  online: { retail: 12.99, label: '.online' },
  site:   { retail: 12.99, label: '.site' },
  shop:   { retail: 17.99, label: '.shop' },
};

export const SUPPORTED_TLDS = Object.keys(DOMAIN_TLD_PRICING);

export function priceForTld(tld) {
  return DOMAIN_TLD_PRICING[tld]?.retail ?? null;
}
