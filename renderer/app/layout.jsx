import './globals.css';

export const metadata = {
  title: 'Capable',
  description: 'AI-generated websites on Capable.',
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
