# AlalAI Documentation Index

AlalAI is a telehealth web application for patient-doctor consultation booking with real-time notifications, virtual consultations, and medical records management.

**Live App**: *(URL to be added after Phase 8.5)*  
**Repo**: https://github.com/lemonjerome/alalai

---

## Documentation Convention

Every feature produces **two files**:
- `*-guide.md` — User-facing: what it does, how to use it, control reference
- `*-technical.md` — Developer-facing: architecture, data models, API endpoints, key functions, security notes

---

## Table of Contents

### Phase 1 — Foundation

| Feature | User Guide | Technical Doc |
|---|---|---|
| Project Setup | [project-setup-guide.md](./01-foundation/project-setup-guide.md) | [project-setup-technical.md](./01-foundation/project-setup-technical.md) |
| Database | [database-guide.md](./01-foundation/database-guide.md) | [database-technical.md](./01-foundation/database-technical.md) |
| CI/CD | [cicd-guide.md](./01-foundation/cicd-guide.md) | [cicd-technical.md](./01-foundation/cicd-technical.md) |
| UI System | [ui-system-guide.md](./01-foundation/ui-system-guide.md) | [ui-system-technical.md](./01-foundation/ui-system-technical.md) |

### Phase 2 — Authentication

| Feature | User Guide | Technical Doc |
|---|---|---|
| Authentication | [authentication-guide.md](./02-auth/authentication-guide.md) | [authentication-technical.md](./02-auth/authentication-technical.md) |
| Patient Profile | [patient-profile-guide.md](./02-auth/patient-profile-guide.md) | [patient-profile-technical.md](./02-auth/patient-profile-technical.md) |

### Phase 3 — Doctor Profile & Discovery

| Feature | User Guide | Technical Doc |
|---|---|---|
| Doctor Profile | [doctor-profile-guide.md](./03-doctor-profile/doctor-profile-guide.md) | [doctor-profile-technical.md](./03-doctor-profile/doctor-profile-technical.md) |
| Doctor Discovery | [doctor-discovery-guide.md](./03-doctor-profile/doctor-discovery-guide.md) | [doctor-discovery-technical.md](./03-doctor-profile/doctor-discovery-technical.md) |
| Dashboards | [dashboard-guide.md](./03-doctor-profile/dashboard-guide.md) | [dashboard-technical.md](./03-doctor-profile/dashboard-technical.md) |

### Phase 4 — Appointment Booking

| Feature | User Guide | Technical Doc |
|---|---|---|
| Appointment Booking | [appointment-booking-guide.md](./04-appointments/appointment-booking-guide.md) | [appointment-booking-technical.md](./04-appointments/appointment-booking-technical.md) |

### Phase 5 — Notifications

| Feature | User Guide | Technical Doc |
|---|---|---|
| Notifications | [notifications-guide.md](./05-notifications/notifications-guide.md) | [notifications-technical.md](./05-notifications/notifications-technical.md) |

### Phase 6 — Consultation Session

| Feature | User Guide | Technical Doc |
|---|---|---|
| Consultation Room | [consultation-guide.md](./06-consultation/consultation-guide.md) | [consultation-technical.md](./06-consultation/consultation-technical.md) |

### Phase 7 — Medical Records

| Feature | User Guide | Technical Doc |
|---|---|---|
| Doctor Records & Notes | [medical-records-doctor-guide.md](./07-medical-records/medical-records-doctor-guide.md) | [medical-records-doctor-technical.md](./07-medical-records/medical-records-doctor-technical.md) |
| Patient Records & History | [medical-records-patient-guide.md](./07-medical-records/medical-records-patient-guide.md) | [medical-records-patient-technical.md](./07-medical-records/medical-records-patient-technical.md) |

### Phase 8 — Polish & Deployment

| Feature | User Guide | Technical Doc |
|---|---|---|
| AI Recommendation (Ollama / gemma4) | [ai-recommendation-guide.md](./08-ai-placeholder/ai-recommendation-guide.md) | [ai-recommendation-technical.md](./08-ai-placeholder/ai-recommendation-technical.md) |
| Security | [security-guide.md](./08-ai-placeholder/security-guide.md) | [security-technical.md](./08-ai-placeholder/security-technical.md) |

---

## API Route Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register patient or doctor |
| GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth handler |
| GET/PATCH | `/api/users/me` | Any | Current user profile |
| GET/PATCH | `/api/users/me/patient-profile` | Patient | Patient health info |
| POST | `/api/users/me/avatar` | Any | Upload profile picture |
| GET | `/api/doctors` | Public | List/search/filter doctors |
| GET | `/api/doctors/[id]` | Public | Single doctor profile |
| GET | `/api/doctors/[id]/availability` | Public | Available slots for date range |
| GET/PATCH | `/api/doctors/me/profile` | Doctor | Doctor manages own profile |
| GET/POST | `/api/doctors/me/availability` | Doctor | Manage weekly slots |
| PATCH/DELETE | `/api/doctors/me/availability/[slotId]` | Doctor | Edit or delete a slot |
| GET | `/api/doctors/me/appointments` | Doctor | Doctor's appointment list |
| GET | `/api/doctors/me/patients` | Doctor | Doctor's patient list |
| POST | `/api/appointments` | Patient | Book an appointment |
| GET | `/api/appointments/[id]` | Patient/Doctor | Single appointment |
| PATCH | `/api/appointments/[id]/reschedule` | Patient | Reschedule |
| PATCH | `/api/appointments/[id]/cancel` | Patient/Doctor | Cancel |
| PATCH | `/api/appointments/[id]/complete` | Doctor | Mark as completed |
| GET | `/api/medical-records` | Patient | Patient's own records |
| GET/POST | `/api/medical-records/[appointmentId]` | Patient/Doctor | View or create record |
| PATCH | `/api/medical-records/[appointmentId]` | Doctor | Update record (72h window) |
| GET | `/api/notifications` | Any | Paginated notifications |
| PATCH | `/api/notifications/[id]/read` | Any | Mark single notification read |
| PATCH | `/api/notifications/read-all` | Any | Mark all notifications read |
| POST | `/api/pusher/auth` | Any | Pusher private channel auth |
| GET | `/api/cron/appointment-reminders` | Cron | Send upcoming reminders |
| GET | `/api/health` | Public | Health check |
| POST | `/api/recommend-doctor` | Patient | AI symptom → specialization + matching doctors |
