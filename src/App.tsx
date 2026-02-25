import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { initTelegram } from "./lib/telegram";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ProductForm from "./pages/ProductForm";
import Inbox from "./pages/Inbox";
import ThreadDetail from "./pages/ThreadDetail";
import Exchanges from "./pages/Exchanges";
import ExchangeDetail from "./pages/ExchangeDetail";
import Settings from "./pages/Settings";

export default function App() {
  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/exchanges" element={<Exchanges />} />
          <Route path="/inbox" element={<Inbox />} />
        </Route>
        <Route path="/inventory/add" element={<ProductForm />} />
        <Route path="/inventory/:id" element={<ProductForm />} />
        <Route path="/inbox/:id" element={<ThreadDetail />} />
        <Route path="/exchanges/:id" element={<ExchangeDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
