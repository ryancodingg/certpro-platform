import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CertPro',
    short_name: 'CertPro',
    description: 'Certification learning and practice.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/brand/certpro-fox-c-v1-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/certpro-fox-c-v1-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
