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
} 