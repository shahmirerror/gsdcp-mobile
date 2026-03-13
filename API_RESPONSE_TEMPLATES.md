# GSDCP Mobile — API Response Templates

This document defines the expected API response structure for each endpoint used by the GSDCP Mobile application.

---

## Base Response Envelope

All API responses follow a consistent envelope format:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional status message"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Dog not found"
  }
}
```

---

## 1. Dogs

### GET /api/dogs

Returns a list of all registered dogs. Supports optional query parameters for filtering.

**Query Parameters:**

| Parameter | Type   | Description                                          |
|-----------|--------|------------------------------------------------------|
| q         | string | Search by dog_name, KP, owner, breeder, color, or titles |
| sex       | string | Filter by sex: `Male` or `Female`                    |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "dog-1",
      "dog_name": "Ares vom Adlerhorst",
      "KP": "GSDCP-2021-0451",
      "breed": "German Shepherd Dog",
      "sex": "Male",
      "dob": "2021-03-15",
      "color": "Black and Tan",
      "imageUrl": "",
      "owner": "",
      "breeder": "Rashid Mehmood",
      "sire": "",
      "dam": "",
      "titles": [],
      "microchip": "900118000123456"
    }
  ]
}
```

**Used by:** Dashboard (featured dogs), Dog Search Screen

---

### GET /api/dogs/:id

Returns a single dog by ID, including full pedigree and related show results.

**Response:**

```json
{
  "success": true,
  "data": {
    "dog": {
      "id": "dog-1",
      "dog_name": "Ares vom Adlerhorst",
      "KP": "GSDCP-2021-0451",
      "breed": "German Shepherd Dog",
      "sex": "Male",
      "dob": "2021-03-15",
      "color": "Black and Tan",
      "imageUrl": "",
      "owner": "",
      "breeder": "Rashid Mehmood",
      "sire": "",
      "dam": "",
      "titles": [],
      "microchip": "900118000123456"
    },
    "showResults": [
      {
        "id": "result-2",
        "showEventId": "show-4",
        "showName": "GSDCP Winter Championship 2024",
        "dogId": "dog-1",
        "dogName": "Ares vom Adlerhorst",
        "handler": "Ahmed Khan",
        "award": "V1 (Excellent)",
        "placement": 2,
        "className": "Open Male",
        "date": "2024-12-08"
      }
    ]
  }
}
```

**Used by:** Dog Profile Screen

---

## 2. Breeders

### GET /api/breeders

Returns a list of all registered breeders. Supports optional search.

**Query Parameters:**

| Parameter | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| q         | string | Search by name, kennel name, or location   |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "breeder-1",
      "name": "Rashid Mehmood",
      "kennelName": "vom Adlerhorst Kennels",
      "location": "Lahore, Punjab",
      "phone": "+92 300 1234567",
      "email": "rashid@adlerhorst.pk",
      "imageUrl": "",
      "activeSince": "2008",
      "totalDogs": 24,
      "description": "Specializing in German show line German Shepherds with excellent temperament and conformation."
    }
  ]
}
```

**Used by:** Breeder Directory Screen

---

### GET /api/breeders/:id

Returns a single breeder by ID, including dogs bred by them.

**Response:**

```json
{
  "success": true,
  "data": {
    "breeder": {
      "id": "breeder-1",
      "name": "Rashid Mehmood",
      "kennelName": "vom Adlerhorst Kennels",
      "location": "Lahore, Punjab",
      "phone": "+92 300 1234567",
      "email": "rashid@adlerhorst.pk",
      "imageUrl": "",
      "activeSince": "2008",
      "totalDogs": 24,
      "description": "Specializing in German show line German Shepherds with excellent temperament and conformation."
    },
    "dogs": [
      {
        "id": "dog-1",
        "dog_name": "Ares vom Adlerhorst",
        "KP": "GSDCP-2021-0451",
        "breed": "German Shepherd Dog",
        "sex": "Male",
        "dob": "2021-03-15",
        "color": "Black and Tan",
        "imageUrl": "",
        "owner": "",
        "breeder": "Rashid Mehmood",
        "sire": "",
        "dam": "",
        "titles": [],
        "microchip": "900118000123456"
      }
    ]
  }
}
```

**Used by:** Breeder Profile Screen

---

## 3. Shows

### GET /api/shows

Returns all show events. Supports optional status filter.

**Query Parameters:**

| Parameter | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| status    | string | Filter by status: `upcoming`, `ongoing`, `completed` |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "show-1",
      "name": "GSDCP National Sieger Show 2025",
      "date": "2025-03-15",
      "location": "Lahore Gymkhana, Lahore",
      "judge": "Herr Wolfgang Fischer (SV Germany)",
      "status": "upcoming",
      "entryCount": 85,
      "description": "The premier annual conformation show of the German Shepherd Dog Club of Pakistan."
    }
  ]
}
```

**Used by:** Dashboard (upcoming shows), Shows Screen

---

### GET /api/shows/:id

Returns a single show event by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "show-4",
    "name": "GSDCP Winter Championship 2024",
    "date": "2024-12-08",
    "location": "Race Course Park, Lahore",
    "judge": "Herr Klaus Schmidt (SV Germany)",
    "status": "completed",
    "entryCount": 72,
    "description": "Winter championship show featuring top dogs from across Pakistan."
  }
}
```

**Used by:** Show Results Screen (show details header)

---

## 4. Show Results

### GET /api/show-results

Returns all show results. Supports optional filtering.

**Query Parameters:**

| Parameter   | Type   | Description                        |
|-------------|--------|------------------------------------|
| showEventId | string | Filter results by show event ID    |
| dogId       | string | Filter results by dog ID           |
| limit       | number | Max number of results to return    |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "result-1",
      "showEventId": "show-4",
      "showName": "GSDCP Winter Championship 2024",
      "dogId": "dog-5",
      "dogName": "Kaiser vom Rheintal",
      "handler": "Naveed Aslam",
      "award": "VA1 (Excellent Select)",
      "placement": 1,
      "className": "Open Male",
      "date": "2024-12-08"
    }
  ]
}
```

**Used by:** Dashboard (recent results), Dog Profile Screen (dog's results), Show Results Screen (grouped by class)

---

### GET /api/show-results/:showId

Returns all results for a specific show, grouped by class name.

**Response:**

```json
{
  "success": true,
  "data": {
    "show": {
      "id": "show-4",
      "name": "GSDCP Winter Championship 2024",
      "date": "2024-12-08",
      "location": "Race Course Park, Lahore",
      "judge": "Herr Klaus Schmidt (SV Germany)",
      "status": "completed",
      "entryCount": 72,
      "description": "Winter championship show featuring top dogs from across Pakistan."
    },
    "resultsByClass": {
      "Open Male": [
        {
          "id": "result-1",
          "showEventId": "show-4",
          "showName": "GSDCP Winter Championship 2024",
          "dogId": "dog-5",
          "dogName": "Kaiser vom Rheintal",
          "handler": "Naveed Aslam",
          "award": "VA1 (Excellent Select)",
          "placement": 1,
          "className": "Open Male",
          "date": "2024-12-08"
        },
        {
          "id": "result-2",
          "showEventId": "show-4",
          "showName": "GSDCP Winter Championship 2024",
          "dogId": "dog-1",
          "dogName": "Ares vom Adlerhorst",
          "handler": "Ahmed Khan",
          "award": "V1 (Excellent)",
          "placement": 2,
          "className": "Open Male",
          "date": "2024-12-08"
        }
      ],
      "Open Female": [
        {
          "id": "result-3",
          "showEventId": "show-4",
          "showName": "GSDCP Winter Championship 2024",
          "dogId": "dog-2",
          "dogName": "Luna von der Stadtmitte",
          "handler": "Faisal Iqbal",
          "award": "VA1 (Excellent Select)",
          "placement": 1,
          "className": "Open Female",
          "date": "2024-12-08"
        }
      ],
      "Puppy Female": [
        {
          "id": "result-8",
          "showEventId": "show-4",
          "showName": "GSDCP Winter Championship 2024",
          "dogId": "dog-6",
          "dogName": "Stella vom Goldental",
          "handler": "Khalid Hussain",
          "award": "VP1 (Very Promising)",
          "placement": 1,
          "className": "Puppy Female",
          "date": "2024-12-08"
        }
      ]
    }
  }
}
```

**Used by:** Show Results Screen

---

## 5. Profile

### GET /api/profile

Returns the authenticated user's profile along with their registered dogs.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1",
      "name": "Ahmed Khan",
      "email": "ahmed.khan@email.com",
      "phone": "+92 300 1112233",
      "membershipId": "GSDCP-M-2019-042",
      "membershipStatus": "active",
      "memberSince": "2019",
      "imageUrl": "",
      "city": "Lahore",
      "dogIds": ["dog-1", "dog-4"]
    },
    "dogs": [
      {
        "id": "dog-1",
        "dog_name": "Ares vom Adlerhorst",
        "KP": "GSDCP-2021-0451",
        "breed": "German Shepherd Dog",
        "sex": "Male",
        "dob": "2021-03-15",
        "color": "Black and Tan",
        "imageUrl": "",
        "owner": "",
        "breeder": "Rashid Mehmood",
        "sire": "",
        "dam": "",
        "titles": [],
        "microchip": "900118000123456"
      }
    ]
  }
}
```

**Used by:** Profile Screen

---

## 6. Dashboard (Composite)

### GET /api/dashboard

Optional composite endpoint that returns all data the Dashboard screen needs in a single call, reducing multiple round-trips.

**Response:**

```json
{
  "success": true,
  "data": {
    "featuredDogs": [
      { "...Dog object..." }
    ],
    "upcomingShows": [
      { "...ShowEvent object (status=upcoming, limit 2)..." }
    ],
    "recentResults": [
      { "...ShowResult object (limit 4, most recent first)..." }
    ]
  }
}
```

**Used by:** Dashboard Screen

---

## Data Type Reference

| Type        | Fields                                                                                                     |
|-------------|-------------------------------------------------------------------------------------------------------------|
| Dog         | id, dog_name, KP, breed, sex, dob, color, imageUrl, owner, breeder, sire, dam, titles, microchip?          |
| Breeder     | id, name, kennelName, location, phone, email, imageUrl, activeSince, totalDogs, description                 |
| ShowEvent   | id, name, date, location, judge, status, entryCount, description                                            |
| ShowResult  | id, showEventId, showName, dogId, dogName, handler, award, placement, className, date                       |
| UserProfile | id, name, email, phone, membershipId, membershipStatus, memberSince, imageUrl, city, dogIds                 |

## Dog Field Mapping (Laravel Backend → Frontend)

| Laravel Backend     | Frontend TypeScript | Description              |
|---------------------|---------------------|--------------------------|
| `$dog->id`          | `id`                | Prefixed with "dog-"     |
| `$dog->dog_name`    | `dog_name`          | Dog's registered name    |
| `$dog->KP`          | `KP`                | Registration/KP number   |
| `$dog->sex`         | `sex`               | Male or Female           |
| `$dog->dob`         | `dob`               | Date of birth (Y-m-d)    |
| `$dog->color`       | `color`             | Coat color               |
| `$dog->breeder_name`| `breeder`           | Breeder name (list API)  |
| `$dog->breeder`     | `breeder`           | Breeder name (detail API)|
| `$dog->microchip_number` | `microchip`    | Microchip number         |

## Status Enums

| Field            | Values                              |
|------------------|--------------------------------------|
| sex              | `Male`, `Female`                     |
| status (show)    | `upcoming`, `ongoing`, `completed`   |
| membershipStatus | `active`, `expired`, `pending`       |
