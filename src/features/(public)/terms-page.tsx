import Navbar from './components/Navbar';

import Footer from './components/Footer';

import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black antialiased">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <Link 
          to="/" 
          className="inline-flex items-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-8 group"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Terms of Service
        </h1>
        <p className="text-xs text-zinc-500 font-medium mb-12">
          Last Updated: June 26, 2026
        </p>

        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed font-normal">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using <strong>Legacy Life Builder</strong> (hosted at <strong>https://www.legacylifebuilder.xyz</strong>), 
              provided by <strong>KONIK</strong>, you agree to be bound by these Terms of Service. If you do not agree with 
              these terms, you are prohibited from using the service and must discontinue use immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              Legacy Life Builder is an online productivity platform designed to help users track routines, habits, and build action plans 
              towards achieving their long-term milestones. Our service includes AI-assisted plan generation features using third-party APIs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. User Accounts & Registration</h2>
            <p>
              When you create an account, you agree to:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li>Provide accurate, current, and complete credentials.</li>
              <li>Maintain the security of your password and accept all risks of unauthorized access.</li>
              <li>Notify us immediately of any security breaches.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate our terms or engage in disruptive behavior.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Intellectual Property</h2>
            <p>
              The code, design layout, brand logo, graphics, and structure of Legacy Life Builder are the intellectual property of 
              <strong>KONIK</strong>. You may not copy, modify, distribute, or reverse-engineer any portion of the service without 
              our prior written consent. All data you enter (goals, plans, habits) remains your personal property.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "as-is" and "as-available" basis. KONIK makes no warranties, expressed or implied, 
              regarding the reliability, completeness, or accuracy of the service. We do not guarantee that the service will be 
              uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Limitation of Liability</h2>
            <p>
              In no event shall KONIK, its developers, or affiliates be liable for any damages (including, without limitation, 
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
              Legacy Life Builder, even if notified of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Modifications to Service & Terms</h2>
            <p>
              We reserve the right to modify or discontinue any part of the service with or without notice. We may update these 
              terms from time to time. Your continued use of the service after changes are posted constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the jurisdiction in which KONIK operates, 
              without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default TermsPage;
