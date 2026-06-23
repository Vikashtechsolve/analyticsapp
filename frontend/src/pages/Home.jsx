import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-slate-50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-xl font-bold text-brand-500">LeetCode Analytics</span>
          <Link to="/admin/login" className="btn-secondary text-sm">
            Instructor Login
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-500 to-amber-400 bg-clip-text text-transparent">
            Student LeetCode Analytics Portal
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            Track classroom progress, leaderboards, daily activity, topics, and streaks — all from
            public LeetCode profiles. Instructors manage classrooms; students view via share link.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/admin/register" className="btn-primary">
              Get Started as Instructor
            </Link>
            <Link to="/admin/login" className="btn-secondary">
              Sign In
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-8">
            Have a classroom link? Open it directly: <code className="text-brand-500">/c/your-classroom-slug</code>
          </p>
        </div>
      </main>
    </div>
  );
}
