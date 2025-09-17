# Nanographer

A modern style discovery platform built with Next.js and Supabase.

## Features

- 🔍 **Search & Filter**: Find styles by name, tags, or category
- 🎨 **Style Gallery**: Browse AI-generated styles with masonry layout
- 💾 **Save Styles**: Bookmark your favorite styles
- 📱 **Responsive Design**: Works on desktop and mobile
- 🌙 **Dark Mode**: Built-in theme switching
- 📤 **Submit Styles**: Users can submit new styles and suggestions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (Database + Auth)
- **State Management**: SWR for data fetching
- **Icons**: Lucide React

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nanographer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your Supabase credentials in `.env.local`

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_APP_URL` - Your app URL (default: http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run setup` - Set up environment and validate

## Database Schema

The app uses Supabase with the following main tables:
- `styles` - Main styles/prompts data
- `prompt_submissions` - User submissions
- `votes` - User likes/saves

## License

Private project