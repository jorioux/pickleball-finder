export interface Report {
  id: string
  locationId: string
  locationName: string
  reportedBy: string // user ID
  reporterEmail: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: any // Firestore Timestamp
}

export interface NewReport {
  locationId: string
  locationName: string
  reason: string
} 