import Navbar from './components/Navbar';

import Footer from './components/Footer';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-xs text-zinc-500 font-medium mb-12">
          Last Updated: June 26, 2026
        </p>

        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed font-normal">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>Legacy Life Builder</strong> (referred to as "we", "our", or "us"), a product of <strong>KONIK</strong>. 
              We are committed to protecting your personal information and your right to privacy. If you have any questions or 
              concerns about our policy or our practices with regards to your personal information, please contact us.
            </p>
            <p className="mt-3">
              By accessing or using our services at <strong>https://www.legacylifebuilder.xyz</strong>, you trust us with your personal info. 
              This privacy policy governs the privacy policies and practices of our application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Information We Collect</h2>
            <p>
              We collect information that you directly provide to us when you create an account, authenticate via third-party providers (such as Google OAuth), or use the services. This includes:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li><strong>Account Credentials:</strong> Email addresses and passwords (encrypted) when creating a manual account.</li>
              <li><strong>Profile Information:</strong> Name, display names, profile photo URLs, and age configurations, retrieved during OAuth signup or manual configuration.</li>
              <li><strong>User Generated Data:</strong> Planner schedules, habits, routines, customized milestones, targets, notes, and goals that you actively input into your dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. How We Use Google User Data</h2>
            <p>
              Legacy Life Builder uses Google OAuth to offer a seamless login experience. When you authenticate using Google, we access:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li>Your primary Google email address (to identify and secure your account).</li>
              <li>Your public profile information (such as your name and profile picture) to personalize your planner dashboard.</li>
            </ul>
            <p className="mt-3">
              We do not request nor do we access write permissions to your Google account, Google Drive, or Google Calendar, unless explicitly requested in future integration features. Your Google user data is strictly used for authentication and profile presentation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. How We Use and Process Data</h2>
            <p>
              We process your personal information for the following purposes:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li>To create, manage, and secure your personal user account.</li>
              <li>To store your schedules, routines, habits, and tasks securely using Supabase database systems.</li>
              <li>To enable AI-based goal planning: if you request AI generation, selected descriptions are sent to LLM providers (e.g., Gemini or OpenRouter) to construct optimized milestone targets. Your personal identification info (like email) is never sent to these AI services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Sharing and Security</h2>
            <p>
              We respect your privacy. <strong>We do not sell, rent, or trade your personal information to third parties</strong>. Your data is stored securely using state-of-the-art database encryption protocols provided by Supabase.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Your Rights and Data Control</h2>
            <p>
              You maintain complete ownership of your personal data. You have the right at any time to:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li>Access and review your stored routines, habits, and plans.</li>
              <li>Edit or delete tasks and habit records directly inside the dashboard UI.</li>
              <li>Request full account deletion, which permanently erases your records from our databases.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by a revised "Last Updated" date above and will be effective as soon as it is accessible. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Contact Us</h2>
            <p>
              If you have any questions, comments, or requests regarding this Privacy Policy, please reach out to us at:
            </p>
            <p className="mt-2 text-zinc-400 font-mono text-xs">
              Email: support@legacylifebuilder.xyz
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default PrivacyPage;
