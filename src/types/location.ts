export interface LocationData {
  name: string
  description: string
  address: string
  numberOfCourts: number
  surfaceType: string
  isIndoor: boolean
  coordinates: {
    lat: number
    lng: number
  }
  photos?: PhotoData[]
}

export interface PhotoData {
  url: string
  uploadedBy: string
  uploadedAt: any // Firestore Timestamp
}

export interface ImageMetadata {
  url: string
  uploadedByUid: string
  uploadedByName: string
  uploadedAt: any // Firestore Timestamp
} 