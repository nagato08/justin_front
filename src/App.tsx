import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./components/AdminShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((module) => ({ default: module.ProductDetailPage })));
const AuthPage = lazy(() => import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })));
const CartPage = lazy(() => import("./pages/CartPage").then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage").then((module) => ({ default: module.OrderDetailPage })));
const OrdersPage = lazy(() => import("./pages/OrdersPage").then((module) => ({ default: module.OrdersPage })));
const AdminCatalogPage = lazy(() => import("./pages/admin/AdminCatalogPage").then((module) => ({ default: module.AdminCatalogPage })));
const AdminProductDetailPage = lazy(() => import("./pages/admin/AdminProductDetailPage").then((module) => ({ default: module.AdminProductDetailPage })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then((module) => ({ default: module.AdminDashboard })));
const AdminDeliveriesPage = lazy(() => import("./pages/admin/AdminDeliveriesPage").then((module) => ({ default: module.AdminDeliveriesPage })));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage").then((module) => ({ default: module.AdminNotificationsPage })));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage").then((module) => ({ default: module.AdminOrdersPage })));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage").then((module) => ({ default: module.AdminSettingsPage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then((module) => ({ default: module.AdminUsersPage })));
const DriverPage = lazy(() => import("./pages/driver/DriverPage").then((module) => ({ default: module.DriverPage })));

function Loader() {
  return <div className="screen-loader"><span /></div>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/produit/:slug" element={<ProductDetailPage />} />
              <Route path="/connexion" element={<AuthPage />} />
              <Route path="/panier" element={<CartPage />} />
              <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
                <Route path="/commande" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:reference" element={<OrderDetailPage />} />
              </Route>
              <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminShell />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="commandes" element={<AdminOrdersPage />} />
                  <Route path="catalogue" element={<AdminCatalogPage />} />
                  <Route path="catalogue/:id" element={<AdminProductDetailPage />} />
                  <Route path="livraisons" element={<AdminDeliveriesPage />} />
                  <Route path="clients" element={<AdminUsersPage />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="reglages" element={<AdminSettingsPage />} />
                </Route>
              </Route>
              <Route element={<ProtectedRoute roles={["DELIVERER"]} />}>
                <Route path="/driver" element={<DriverPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </CartProvider>
      </AuthProvider>
      <PwaInstallPrompt />
    </BrowserRouter>
  );
}

export default App;
