import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { VendorDirectoryPage } from "./pages/VendorDirectoryPage";

function App() {
  return (
    <main className="app-shell">
      <Header />
      <VendorDirectoryPage />
      <Footer />
    </main>
  );
}

export default App;
