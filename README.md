# CampusSync

CampusSync is a React, TypeScript, Tailwind CSS, Firebase Authentication, and Cloud Firestore app for campus event orchestration.

## Requirements Coverage

- Identity and RBAC: Google sign-in creates student users by default, a configured admin UID receives admin access, protected routes enforce admin/student access, and Firestore rules reject unauthorized event management writes.
- Event lifecycle: Admins can create, edit, and delete events with `Draft` or `Active` status. `Full` and `Completed` are derived from capacity and event date.
- Student registration: Students can view active events and register with one click. Registration uses a Firestore transaction that reads the event and registration document, rejects duplicate registrations, checks `currentParticipants < maxCapacity`, writes the registration, and increments capacity atomically.
- Auditor export: Admins can download a CSV of registrations per event, including event title, student email, display name, UID, and timestamp.
- UI: The app uses a restrained slate/emerald palette, consistent cards, compact controls, responsive grids, and minimal page layouts.

## Firebase Security

Security rules live in `firestore.rules` and are referenced by `firebase.json`.

The rules allow admins to manage event documents. Because this proof of concept performs student registration directly from the client, students are only permitted to update the event counter fields in a narrow transaction path while registration documents are restricted to the authenticated student UID. In a production deployment, this counter update would be a good candidate for a Cloud Function if event documents must be completely admin-only for every write path.

## Concurrency and Security Explanation

### Concurrency Problem

The core concurrency challenge in the system is preventing race conditions during simultaneous event registrations.

Example:

- An event has 49/50 participants registered
- Two students click "Register" at nearly the same time
- Without concurrency protection, both requests may read the same participant count and both registrations could succeed
- This would overbook the event and corrupt participant counts

To solve this, the application uses Firestore transactions.

The transaction:

1. Reads the current event document
2. Reads the registration document for the student
3. Rejects duplicate registrations
4. Checks whether `currentParticipants < maxCapacity`
5. Creates the registration document
6. Atomically increments the participant counter

Because all operations occur inside a single transaction, Firestore guarantees consistency even under concurrent access.

### Security Problem

The security challenge is preventing unauthorized users from modifying protected data.

The application uses Firebase Authentication together with Firestore Security Rules to enforce role-based access control.

The rules ensure:

- Only authenticated users can create registrations
- Students can only create registration documents tied to their own UID
- Only admins can create, edit, or delete event documents
- Unauthorized writes are rejected directly by Firestore even if frontend protection is bypassed

This prevents:

- Unauthorized event modification
- Registration spoofing
- Cross-user registration writes
- Direct database tampering from the client

Because this proof of concept performs registration logic directly from the client, event counter updates are narrowly scoped inside the transaction rules. In a production deployment, this logic would ideally be moved to trusted backend infrastructure such as Cloud Functions.