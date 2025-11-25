// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Signup from "./pages/SignUp";
import PrivateRoute from "./PrivateRoute";
import AccountsPayableDashboard from "./pages/AccountsPayableDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Public Routes === */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* === Protected Routes without Sidebar === */}
        <Route
          path="/landing"
          element={
            <PrivateRoute>
              <Landing />
            </PrivateRoute>
          }
        />
      {/* <Route path="/insights" element={ <Layout><AccountsPayableDashboard /></Layout> } /> */}
        {/* === Protected Routes with Layout/Sidebar === */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/ai-assistant/:convId?" element={<AIAssistant />} />
          <Route path="/insights" element={<AccountsPayableDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
export default App;