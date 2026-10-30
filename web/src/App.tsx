import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import SendPage from "./pages/SendPage";
import MessengerPage from "./pages/MessengerPage";
import FlightsPage from "./pages/FlightsPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="spedisci" element={<SendPage />} />
        <Route path="messenger" element={<MessengerPage />} />
        <Route path="voli" element={<FlightsPage />} />
        <Route path="pagamento/successo" element={<PaymentSuccess />} />
        <Route path="condizioni" element={<TermsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
