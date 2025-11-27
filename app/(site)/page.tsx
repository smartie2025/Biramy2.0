import NavBar from "@/components/marketing/NavBar";
import Hero from "@/components/marketing/Hero";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <>
      {/* probe bar — should appear as a thin rose strip at the very top */}
      {/* <div className="h-2 bg-rose-500" /> */}

      <NavBar />
      <Hero />
      <Footer />
    </>
  );
}
