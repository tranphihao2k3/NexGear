import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 96,
    height: 96,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0c0c0c',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00C4AD',
                    borderRadius: '24px',
                    fontSize: 64,
                    fontWeight: 900,
                    fontFamily: 'sans-serif',
                    border: '4px solid #F0356A',
                }}
            >
                N
            </div>
        ),
        { ...size }
    )
}
