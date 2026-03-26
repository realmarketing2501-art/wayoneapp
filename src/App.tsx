import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import InvestPage from "./pages/InvestPage";
import NetworkPage from "./pages/NetworkPage";
import IncomePage from "./pages/IncomePage";
import FundPage from "./pages/FundPage";
import WithdrawPage from "./pages/WithdrawPage";
import ProfilePage from "./pages/ProfilePage";
import TaskCenterPage from "./pages/TaskCenterPage";
import LoginPage from "./pages/LoginPage";
import DepositPage from "./pages/DepositPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

                <Route path="/" element={<HomePage />} />
                <Route path="/invest" element={<InvestPage />} />
                <Route path="/network" element={<NetworkPage />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/fund" element={<FundPage />} />
                <Route path="/withdraw" element={<WithdrawPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/tasks" element={<TaskCenterPage />} />
                <Route path="/deposit" element={<DepositPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
