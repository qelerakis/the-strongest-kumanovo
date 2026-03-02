import { getFullSchedule } from "@/lib/queries/schedule";
import Nav from "@/components/landing/nav";
import Hero from "@/components/landing/hero";
import SportsShowcase from "@/components/landing/sports-showcase";
import ScheduleDisplay from "@/components/landing/schedule-display";
import ContactSection from "@/components/landing/contact-section";
import Footer from "@/components/landing/footer";

export default async function Home() {
  const schedule = await getFullSchedule();

  return (
    <div className="grain-overlay min-h-screen bg-surface">
      <Nav />

      <main>
        <Hero />
        <SportsShowcase />
        <ScheduleDisplay schedule={schedule} />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
