import Login from './pages/login/Login'
import Signup from './pages/signup/Signup'
import Home from './pages/home/Home'
import Chat from './pages/chat/Chat'
import Account from './pages/account/Account'

const App = () => {
  const { pathname } = window.location

  const isSignupPage =
    pathname === '/register' ||
    pathname === '/signup'

  if (pathname === '/chat') {
    return <Chat />
  }

  if (pathname === '/account') {
    return <Account />
  }

  if (pathname === '/login') {
    return <Login />
  }

  if (pathname === '/') {
    return <Home />
  }

  return isSignupPage ? <Signup /> : <Login />
}

export default App