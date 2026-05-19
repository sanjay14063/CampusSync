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

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

Set the Firebase config in `.env` and update `ADMIN_UIDS` in `src/context/AuthContext.tsx` and `firestore.rules` with the production admin UID list.
