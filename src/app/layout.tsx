import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import './globals.css'

const montserrat = Roboto_Mono({
	variable: '--font-montserrat-sans',
	subsets: ['latin'],
	display: 'swap',
})

export const metadata: Metadata = {
	title: 'Cloud Deck',
	description: 'Cloud Deck is a real-time estimation tool for agile teams.',
	icons: {
		icon: '/favicon.ico',
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<body className={`${montserrat.variable} antialiased`}>{children}</body>
		</html>
	)
}
