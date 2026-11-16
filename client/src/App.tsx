import Login from './pages/login/Login'
import Signup from './pages/signup/Signup'

const App = () => {
  const isSignupPage =
    window.location.pathname === '/register' ||
    window.location.pathname === '/signup'

  return isSignupPage ? <Signup /> : <Login />
}

export default App