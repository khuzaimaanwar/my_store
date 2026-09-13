# Security Specification & Threat Model

## 1. Core Data Invariants

1. **Strict User Isolation**: All business data (inventory spare parts, sales records, customer profiles) is strictly scoped under `/users/{userId}/...`. A user with ID `A` cannot read, create, update, or delete any record belonging to user `B`.
2. **Identity Integrity**: For any write operation under `/users/{userId}`, the path variable `userId` must match `request.auth.uid`. The internal document field `userId` (when present) must also match `request.auth.uid`.
3. **No Unauthenticated Access**: Unauthenticated requests (`request.auth == null`) are rejected with `PERMISSION_DENIED` across all paths.
4. **Valid IDs and Sizes**: Document ID path variables must satisfy `isValidId(id)` (alphanumeric, dashes, underscores, max length 128 characters) to prevent ID poisoning and denial-of-wallet payload attacks.
5. **Schema Validation & Anti-Update-Gap**: All product, sale, customer, and user profile writes must satisfy strict type checks, field size caps, and non-negative numeric constraints (e.g., non-negative price, non-negative stock quantity).
6. **Immutable Critical Identifiers**: Once created, the `id` and `userId` fields cannot be altered or reassigned to a different owner.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Payload 1 (Cross-Tenant Product Read)**: Authenticated user `attacker_1` attempts to read `/users/victim_9/products/part_123`. Must return `PERMISSION_DENIED`.
2. **Payload 2 (Cross-Tenant Product Injection)**: Authenticated user `attacker_1` attempts to create `/users/victim_9/products/spoofed_part` with `userId: "victim_9"`. Must return `PERMISSION_DENIED`.
3. **Payload 3 (Unauthenticated Sales Extraction)**: Unauthenticated client (`request.auth == null`) attempts to query `/users/shop_1/sales`. Must return `PERMISSION_DENIED`.
4. **Payload 4 (Ghost Field / Shadow Key Attack)**: User attempts to create a product with an unapproved field `{ name: "Brake Pad", role: "superadmin" }`. Must return `PERMISSION_DENIED`.
5. **Payload 5 (Negative Quantity / Price Exploitation)**: User attempts to create a product with negative stock `{ quantity: -50 }` or negative price `{ sellingPrice: -100 }`. Must return `PERMISSION_DENIED`.
6. **Payload 6 (Oversized Payload / Wallet Drain Attack)**: User attempts to inject a 10MB string into the `name` or `notes` field. Must return `PERMISSION_DENIED` via strict `.size()` checks.
7. **Payload 7 (Path Traversal / Junk Character ID Injection)**: User attempts to write to `/users/{uid}/products/../../secrets` or an ID longer than 128 characters or containing punctuation like `<script>`. Must return `PERMISSION_DENIED`.
8. **Payload 8 (Owner Impersonation)**: User `attacker_1` writes to `/users/attacker_1/products/part_1` with `userId: "victim_9"`. Must return `PERMISSION_DENIED` due to identity mismatch between `userId` and `request.auth.uid`.
9. **Payload 9 (Cross-Tenant Sale Deletion)**: User `attacker_1` attempts to delete an invoice record at `/users/victim_9/sales/inv_555`. Must return `PERMISSION_DENIED`.
10. **Payload 10 (Sale Tampering / Amount Forgery)**: User attempts to update an existing closed sale invoice's `totalAmount` or `userId`. Must return `PERMISSION_DENIED`.
11. **Payload 11 (Customer Directory Harvesting)**: User `attacker_1` attempts to list `/users/victim_9/customers`. Must return `PERMISSION_DENIED`.
12. **Payload 12 (Catch-All Top-Level Collection Infiltration)**: Attacker attempts to read or write to arbitrary top-level root collections `/admin`, `/secrets`, or `/invoices`. Must return `PERMISSION_DENIED` by default-deny catch-all.
