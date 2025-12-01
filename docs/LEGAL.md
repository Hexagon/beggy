# Legal Requirements (Lagkrav)

This document outlines the legal requirements that Beggy must comply with as a Swedish online
marketplace.

## BBS-lagen (Lagen om elektroniska anslagstavlor)

The Swedish Bulletin Board System Act (SFS 1998:112) applies to electronic bulletin boards like
Beggy.

### Key Requirements

1. **Contact Information**: The service must provide contact information for the operator
2. **Content Moderation**: The operator must monitor content and remove illegal material when
   discovered
3. **Report Function**: Users must be able to report illegal or inappropriate content
4. **Response Time**: Reports must be handled within reasonable time

### Implementation

- Report button on all ads (implemented in `/api/ads/:id/report`)
- Admin notification system for handling reports
- Contact information available on the "Om Beggy" page
- Note: Reporter IP is NOT stored (privacy improvement - not needed for report handling)

## GDPR (Dataskyddsförordningen)

The General Data Protection Regulation (EU) 2016/679 applies to all personal data processing.

### User Rights

1. **Right of Access (Article 15)**: Users can request all their data
2. **Right to Rectification (Article 16)**: Users can correct their data
3. **Right to Erasure (Article 17)**: "Right to be forgotten" - users can delete all their data
4. **Right to Data Portability (Article 20)**: Users can export their data in machine-readable
   format

### Implementation

- **Data Access/Export**: GET `/api/auth/my-data` - returns all user data in JSON format
- **Account Deletion**: DELETE `/api/auth/account` - deletes all user data including:
  - Profile information (username, email, contact info, city)
  - All ads created by the user
  - All images uploaded by the user (deleted from storage)
  - All conversations and messages
- **Data Display**: When an ad is deleted, all associated personal data and images are permanently
  removed

## Personal Data Fields Documentation

The following database fields contain personal data:

### profiles table

| Field      | Data Type | Purpose                                     | Legal Basis           | Retention              |
| ---------- | --------- | ------------------------------------------- | --------------------- | ---------------------- |
| id         | UUID      | Unique user identifier                      | Contract (Art. 6.1.b) | Until account deletion |
| email      | TEXT      | Account login and identification            | Contract (Art. 6.1.b) | Until account deletion |
| username   | TEXT      | Public display name (no real name required) | Contract (Art. 6.1.b) | Until account deletion |
| created_at | TIMESTAMP | Account creation date                       | Contract (Art. 6.1.b) | Until account deletion |
| updated_at | TIMESTAMP | Profile last updated                        | Contract (Art. 6.1.b) | Until account deletion |

### ads table

| Field         | Data Type | Purpose                                      | Legal Basis           | Retention         |
| ------------- | --------- | -------------------------------------------- | --------------------- | ----------------- |
| user_id       | UUID      | Link ad to user                              | Contract (Art. 6.1.b) | Until ad deletion |
| title         | TEXT      | Ad title                                     | Contract (Art. 6.1.b) | Until ad deletion |
| description   | TEXT      | Ad description (may contain personal info)   | Contract (Art. 6.1.b) | Until ad deletion |
| county        | TEXT      | Ad location (Swedish county)                 | Contract (Art. 6.1.b) | Until ad deletion |
| contact_phone | TEXT      | Optional public contact phone (with warning) | Consent (Art. 6.1.a)  | Until ad deletion |
| contact_email | TEXT      | Optional public contact email (with warning) | Consent (Art. 6.1.a)  | Until ad deletion |
| created_at    | TIMESTAMP | Ad creation date                             | Contract (Art. 6.1.b) | Until ad deletion |
| updated_at    | TIMESTAMP | Ad last updated                              | Contract (Art. 6.1.b) | Until ad deletion |
| expires_at    | TIMESTAMP | Ad expiry (30 days from creation)            | Contract (Art. 6.1.b) | Until ad deletion |

### conversations table

| Field          | Data Type | Purpose                                   | Legal Basis           | Retention                   |
| -------------- | --------- | ----------------------------------------- | --------------------- | --------------------------- |
| buyer_id       | UUID      | Link conversation to buyer                | Contract (Art. 6.1.b) | 90 days after ad deletion   |
| seller_id      | UUID      | Link conversation to seller               | Contract (Art. 6.1.b) | 90 days after ad deletion   |
| encryption_key | TEXT      | Key reference for message encryption      | Contract (Art. 6.1.b) | 90 days after ad deletion   |
| expires_at     | TIMESTAMP | Conversation expiry (set when ad deleted) | Contract (Art. 6.1.b) | Until conversation deletion |

### messages table

| Field             | Data Type | Purpose                          | Legal Basis           | Retention                 |
| ----------------- | --------- | -------------------------------- | --------------------- | ------------------------- |
| sender_id         | UUID      | Link message to sender           | Contract (Art. 6.1.b) | 90 days after ad deletion |
| encrypted_content | TEXT      | E2E encrypted message content    | Contract (Art. 6.1.b) | 90 days after ad deletion |
| iv                | TEXT      | Encryption initialization vector | Contract (Art. 6.1.b) | 90 days after ad deletion |

### images table

| Field        | Data Type | Purpose                | Legal Basis           | Retention         |
| ------------ | --------- | ---------------------- | --------------------- | ----------------- |
| storage_path | TEXT      | Path to uploaded image | Contract (Art. 6.1.b) | Until ad deletion |

### reports table

| Field   | Data Type | Purpose                          | Legal Basis                     | Retention            |
| ------- | --------- | -------------------------------- | ------------------------------- | -------------------- |
| details | TEXT      | Report details (may contain PII) | Legitimate interest (Art 6.1.f) | Until report handled |

**Note:** The reports table does NOT store reporter IP addresses (removed for privacy).

## Data Protection Measures

### Encryption

- **Chat messages** are encrypted using AES-256-GCM
- Only conversation participants (sender and receiver) can decrypt messages
- Encryption keys are derived from conversation IDs and a server secret
- Messages cannot be read by system administrators without the encryption key

### Data Minimization

- Only username is shown publicly (no real name required)
- Contact phone/email are optional and shown with privacy warning
- Reporter IP is not stored (not needed for report handling)
- Ads automatically expire after 30 days
- Conversations are deleted 90 days after ad deletion

### Forbidden Words Filter

A forbidden words filter is applied to all user-facing content:

- Ad titles and descriptions
- Usernames
- Chat messages

This helps prevent offensive content and protects users.

## Cookie Law (Lagen om elektronisk kommunikation)

The Swedish Electronic Communications Act (SFS 2003:389) implements the ePrivacy Directive.

### Requirements

1. **Information**: Users must be informed about cookies used
2. **Consent**: Consent required for non-essential cookies
3. **Essential Cookies**: Strictly necessary cookies are exempt from consent

### Implementation

Beggy only uses essential cookies:

| Cookie          | Purpose                     | Type      | Duration |
| --------------- | --------------------------- | --------- | -------- |
| `access_token`  | User authentication session | Essential | 7 days   |
| `refresh_token` | Session refresh             | Essential | 30 days  |

No tracking, analytics, or advertising cookies are used. Therefore, no cookie consent banner is
required (only essential cookies are used for authentication).

## Contact Information

For legal inquiries, contact via GitHub:
[github.com/Hexagon/beggy](https://github.com/Hexagon/beggy)

## Related Documentation

- [Privacy Policy](/integritetspolicy) - Public-facing privacy policy in Swedish
- [Terms of Service](/villkor) - Public-facing terms in Swedish
- [CONTRIBUTING.md](CONTRIBUTING.md) - Guidelines for contributors regarding legal compliance
