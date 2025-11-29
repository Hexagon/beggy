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
  - Profile information (name, email, phone, city)
  - All ads created by the user
  - All images uploaded by the user (deleted from storage)
- **Data Display**: When an ad is deleted, all associated personal data and images are permanently
  removed

### Data Processing

| Data       | Purpose                | Legal Basis           | Retention              |
| ---------- | ---------------------- | --------------------- | ---------------------- |
| Email      | Account identification | Contract (Art. 6.1.b) | Until account deletion |
| Name       | Seller identification  | Contract (Art. 6.1.b) | Until account deletion |
| Phone      | Optional contact       | Consent (Art. 6.1.a)  | Until account deletion |
| City       | Location filtering     | Contract (Art. 6.1.b) | Until account deletion |
| Ad content | Service delivery       | Contract (Art. 6.1.b) | Until ad deletion      |
| Images     | Ad presentation        | Contract (Art. 6.1.b) | Until ad deletion      |

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
