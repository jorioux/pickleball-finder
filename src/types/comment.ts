export interface Comment {
  id: string
  locationId: string
  userId: string
  userDisplayName: string
  text: string
  createdAt: any // Firestore Timestamp
}

export interface NewComment {
  text: string
} 