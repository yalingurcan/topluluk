import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopNav from './TopNav'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0 md:pt-16">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
