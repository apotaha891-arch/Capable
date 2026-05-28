# Capable Platform — Business Model & Implementation Spec

**Document Purpose:** Engineering specification for implementing Capable's monetization and revenue pipeline.

**Date:** May 27, 2026  
**Audience:** Engineering team (Claude Code, etc.)

---

## Executive Summary

Capable is a **freemium MVP builder platform** with a **land-and-expand revenue model**. We capture startups early with free MVP building, monetize through token limits and premium features, then expand revenue as they scale.

**Core Value:** Speed and simplicity to deploy MVPs.

---

## Revenue Streams

### 1. Token-Based Usage (Freemium Model)

**Free Tier:**
- Daily token limit (TBD: 100-500 tokens/day suggested)
- Tokens consumed per action: building, deploying, AI features, etc.
- When users hit daily limit → upgrade prompt

**Paid Tokens:**
- Users can purchase additional tokens for daily/monthly top-ups
- Pricing: TBD (e.g., $0.10 per 100 tokens, or package pricing)
- Unlimited tokens on paid tiers

**Implementation Notes:**
- Track token consumption per user per day
- Reset tokens daily at midnight (user timezone)
- Show remaining tokens in UI prominently
- Trigger upgrade modal when limit reached

---

### 2. Custom Domain Deployment ($49/month)

**Free Hosting (Capable Domain):**
- Publish completed MVPs to `{projectname}.capable.app` (or similar)
- No cost to user
- Builds network effect and marketplace
- User gets shareable link, visibility in Capable ecosystem

**Premium Hosting (Custom Domain):**
- Deploy to user's own domain (e.g., `user.com`)
- **Price: $49/month per project**
- Includes: deployment infrastructure, SSL, uptime monitoring, basic support
- User owns custom domain branding

**Implementation Notes:**
- Detect when user selects "custom domain deployment"
- Trigger subscription setup (Stripe, payment processor)
- Manage DNS configuration for custom domains
- Monitor deployment status, logs, and uptime
- Billing: recurring monthly charge
- Feature flag: custom domain deployment only available on paid subscription

---

### 3. Project Marketplace & Cloning

**Published Projects (Free to Browse):**
- Successful MVPs can be published to Capable marketplace
- Other users can clone/fork published projects
- Cloned projects deploy to Capable domain (free)
- Original creator gets visibility, builds portfolio

**Revenue Opportunity:**
- Cloned projects hosted on Capable domain = no direct charge
- If clone owner wants custom domain → $49/month charge applies
- Creates network effect and discovery mechanism

**Implementation Notes:**
- Add "Publish to Marketplace" button in project settings
- Support project cloning (copy all code, config, environment)
- Display published projects with metadata (creator, description, usage stats)
- Track which projects are clones vs originals

---

### 4. Technical Consulting & Implementation Services

**Passive Service Offering:**
- Do NOT actively push sales
- Mention casually: "We can help with implementation if you need"
- Position as available resource, not primary product

**Service Model:**
- Project-based consulting (quoted per engagement)
- Helping startups optimize code, add features, scale infrastructure
- Targeted at users showing growth signals (high token usage, planning fundraising, etc.)

**Implementation Notes:**
- Track growth signals (usage patterns, feature requests, domain requests)
- CTA in dashboard: "Need help scaling? We offer consulting services."
- Direct outreach for high-engagement users
- Pricing: internal process (to be defined separately)

---

### 5. Enterprise/Team Features (Future)

**Target:** Agencies, scale-ups, enterprises building multiple MVPs

**Potential Features:**
- Team collaboration (multi-user projects)
- Audit logs and compliance
- Dedicated account manager
- Priority support
- Advanced analytics
- White-label options

**Implementation Notes:**
- Phase 2+ priority
- Linked to customer growth trajectory
- Pricing: custom enterprise negotiation

---

## Customer Journey & Revenue Expansion

### Stage 1: MVP Validation (Free → Tokens)
- User signs up, builds free MVP with token limit
- Hits daily limit → upgrade prompt
- Pays for extra tokens or subscribes for unlimited

### Stage 2: MVP Published (Marketplace)
- Successful MVP published to Capable.app domain (free)
- Gains visibility in marketplace
- Other users may clone project

### Stage 3: Custom Domain (Primary Revenue)
- User ready to go live with their own branding
- Deploys to custom domain: **$49/month charge**
- Billing starts immediately

### Stage 4: Scaling (Consulting & Enterprise)
- User showing growth signals (usage, fundraising, team expansion)
- Reach out: "Need help scaling?"
- Offer consulting, team features, enterprise support
- Custom pricing negotiations

---

## Technical Requirements

### Core Features to Build

**1. Token System**
- [ ] Token accounting (consumption tracking per user, per action)
- [ ] Daily token reset logic
- [ ] Token limit enforcement (block actions when limit reached)
- [ ] UI display: remaining tokens, upgrade prompt
- [ ] Payment integration for token top-ups

**2. Custom Domain Deployment**
- [ ] DNS configuration management
- [ ] SSL certificate provisioning (Let's Encrypt or similar)
- [ ] Deployment pipeline for custom domains
- [ ] Subdomain vs custom domain routing logic
- [ ] Payment integration (Stripe subscription)
- [ ] Billing dashboard for users

**3. Project Publishing & Marketplace**
- [ ] "Publish to Marketplace" UI flow
- [ ] Marketplace discovery page (browse published projects)
- [ ] Clone/fork functionality (copy project + all assets)
- [ ] Project metadata (creator, description, stats)
- [ ] Visibility controls (public/private projects)

**4. User Analytics & Growth Tracking**
- [ ] Dashboard: token consumption trends
- [ ] Dashboard: deployment history, uptime
- [ ] Growth signal detection (high usage, custom domain requests, etc.)
- [ ] User activity logs (for consultant outreach targeting)

**5. Billing & Subscription Management**
- [ ] Payment processor integration (Stripe recommended)
- [ ] Subscription management (recurring $49/month for custom domains)
- [ ] Invoice generation
- [ ] Billing history in user dashboard
- [ ] Automatic renewal, cancellation, failed payment handling

---

## Metrics to Track

Track these metrics to understand revenue health and customer progression:

1. **User Acquisition**
   - Signups, free tier activation

2. **Token Monetization**
   - Free tier users hitting daily limit
   - Percentage converting to paid tokens
   - Average token spend per paying user

3. **Custom Domain Revenue**
   - New custom domain subscriptions per month
   - Churn rate (cancellations)
   - MRR (Monthly Recurring Revenue)

4. **Marketplace Engagement**
   - Published projects count
   - Project clones per month
   - Click-through rate to clone

5. **Consulting Pipeline**
   - High-engagement users identified
   - Consulting inquiries, conversion rate
   - Average consulting deal value

6. **Lifetime Value**
   - LTV per user cohort
   - Expansion revenue (token → domain → consulting)

---

## Implementation Priority

### MVP Phase (Weeks 1-4)
1. Token system + daily limits
2. Token consumption tracking
3. Upgrade prompt UI
4. Basic payment integration (token top-ups)

### Phase 2 (Weeks 5-8)
1. Custom domain deployment
2. Marketplace publishing
3. Project cloning
4. Billing for custom domains ($49/month)

### Phase 3 (Weeks 9+)
1. Analytics dashboard
2. Growth signal detection
3. Team collaboration features
4. Enterprise features

---

## Notes for Engineering

- **Simplicity first:** The model should feel effortless to users. No complex tiers, just token limits and domain upgrades.
- **Billing reliability:** Custom domain billing is recurring revenue. Payment failures = lost MRR. Robust retry logic required.
- **Token granularity:** TBD exactly which actions consume tokens. Suggest: API calls, AI features, large deployments.
- **Marketplace discovery:** Published projects should be discoverable and attractive. Consider sorting by popularity, recency, creator reputation.
- **Compliance:** Ensure GDPR/data residency compliance for custom domain hosting.

---

## Questions for CTO

Before implementation, confirm:
1. Daily token limit (100? 500? 1000?)
2. Token pricing and package options
3. Which features consume tokens (and at what rate)?
4. Hosting provider for custom domains (AWS, Vercel, self-hosted?)
5. Payment processor preference (Stripe, etc.)

---

**End of Spec**

*This document is the source of truth for Capable's revenue model. All feature implementation should reference this spec.*
