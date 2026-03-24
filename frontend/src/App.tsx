import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import HomePage from "./pages/home/HomePage";
import CreateEditListingPage from "./pages/listings/createeditlistingpage";
import ListingDetailPage from "./pages/listings/ListingDetailPage";
import MessagingPage from "./pages/messages/MessagingPage";
import ReviewsPage from "./pages/reviews/ReviewsPage";
import ProfilePage from "./pages/profile/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/create-listing" element={<CreateEditListingPage />} />
          <Route path="/edit-listing/:id" element={<CreateEditListingPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/profile" element={<ProfilePage/>} />
          <Route path="/user/:userId" element={<ProfilePage/>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}