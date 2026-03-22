

## Email Platform Integration Plan

### Important Scope Note

Lovable has built-in email sending (outgoing) for auth and app notifications. However, **incoming email** (receiving external emails into the app) requires a third-party service with inbound email webhooks — this is complex and not natively supported. Your existing Chat page already handles in-app team messaging, which may cover the "inbox" need without actual email.

This plan covers what's achievable with Lovable's built-in email system, plus an enhanced in-app messaging experience.

---

### Phase 1: Email Domain Setup
- Set up a custom sender domain via Cloud so emails come from your brand (e.g. `notify@yourdomain.com`)
- This is a prerequisite for all outgoing email features

### Phase 2: Auth Emails
- Scaffold branded auth email templates (password reset, email verification, magic links)
- Style templates to match your app's green/sports theme
- Deploy the `auth-email-hook` edge function

### Phase 3: App Notification Emails (Transactional)
- **Game reminder emails**: Send to team members before upcoming games
- **Feedback confirmation emails**: Confirm when a player submits feedback
- **Team update emails**: Notify players when a coach posts important updates
- Create React Email templates for each, register in the template registry
- Wire up triggers in the existing UI (e.g. after feedback submission, before game day)

### Phase 4: Contact Form
- Add a contact/support page with a form (name, email, message)
- Create a `contact_submissions` database table
- Send confirmation email to the submitter via the transactional email system

### Phase 5: Enhanced Team Messaging
- Improve the existing Chat page with:
  - Direct messages between any two team members (coach-to-player, player-to-player)
  - Unread message indicators/badges in the nav
  - Message timestamps and read receipts
  - Coach announcements pinned at top

### What's NOT Included
- **Inbound email receiving** (emails sent from Gmail/Outlook into the app) — this requires a third-party inbound email service (e.g. Mailgun inbound routing) and is significantly more complex. If you need this, we'd need to integrate an external provider.

---

### Technical Details

**Database changes:**
- New `contact_submissions` table (name, email, message, created_at)
- Add `is_read` boolean to `chat_messages` for read tracking
- Add `is_pinned` boolean to `chat_messages` for announcements

**Edge Functions:**
- `auth-email-hook` — branded auth emails
- `send-transactional-email` — all app notification emails
- `handle-email-unsubscribe` — unsubscribe handling
- `handle-email-suppression` — bounce/complaint tracking

**New pages/components:**
- Contact form page
- Unsubscribe page
- Enhanced Chat with DM support and unread badges

**Templates (React Email):**
- `game-reminder` — upcoming game notification
- `feedback-confirmation` — feedback submission acknowledgment
- `contact-confirmation` — contact form receipt

