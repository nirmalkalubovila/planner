import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Send, CreditCard, RefreshCw, MessageSquare } from 'lucide-react';

type InquiryType = 'Refund Request' | 'Subscription Cancellation' | 'Billing Question' | 'Other';

const INQUIRY_ICONS: Record<InquiryType, React.ReactNode> = {
  'Refund Request': <RefreshCw className="h-3.5 w-3.5" />,
  'Subscription Cancellation': <CreditCard className="h-3.5 w-3.5" />,
  'Billing Question': <CreditCard className="h-3.5 w-3.5" />,
  'Other': <MessageSquare className="h-3.5 w-3.5" />,
};

export function RefundPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('Refund Request');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Prefill user email if authenticated
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('billing_inquiries')
        .insert({
          email: email.trim(),
          inquiry_type: inquiryType,
          subject: subject.trim(),
          message: message.trim(),
          user_id: user?.id || null,
        });

      if (error) throw error;

      toast.success('Your request has been submitted successfully! We will get back to you shortly.');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Failed to submit billing inquiry:', err);
      toast.error('Failed to send request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          Return & Refund Policy
        </h1>
        <p className="text-xs text-zinc-500 font-medium mb-12">
          Last Updated: June 26, 2026
        </p>

        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed font-normal mb-16">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Subscriptions and Digital Services</h2>
            <p>
              Legacy Life Builder is an online, AI-powered goal planning and habit scheduling application. Because our services are 
              <strong> digital goods delivered instantly</strong> over the internet, we enforce a transparent policy regarding subscription billings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Cancellation of Subscription</h2>
            <p>
              You are free to cancel your active subscription at any time. Once canceled:
            </p>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-zinc-400">
              <li>You will retain full access to premium planner features until the end of your current monthly billing period.</li>
              <li>No further automatic monthly renewals will be charged to your card.</li>
              <li>Subscriptions can be easily managed and canceled via your profile settings or by submitting a cancellation request below.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Refund Request Window</h2>
            <p>
              We want you to be completely satisfied with your experience. We offer a **7-day money-back guarantee**:
            </p>
            <p className="mt-2.5">
              If you request a refund within **7 calendar days** of your initial subscription or any monthly renewal charge, 
              we will issue a full refund of your payment ($1.00 USD) to your original payment method. 
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Processing Refunds</h2>
            <p>
              Once your refund request is received and verified, we will notify you of the approval or rejection. 
              If approved, your refund will be processed, and a credit will automatically be applied to your credit card or 
              original payment method. 
            </p>
            <p className="mt-2.5">
              Please note that refund processing times may vary (usually **3 to 7 business days**) depending on your card issuer and 
              the PayHere payment gateway policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Abuse of Refund Policy</h2>
            <p>
              We reserve the right to deny refund requests if we detect account abuse, fraudulent activity, or repetitive subscribing 
              and unsubscribing behavior designed to bypass our normal monthly subscription fees.
            </p>
          </section>
        </div>

        {/* Interactive Billing Support Form */}
        <section className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-zinc-800">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Billing Support Form</h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                Submit a refund request, ask subscription questions, or cancel billing.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                required
                className="h-11 rounded-xl bg-zinc-900/30 border-zinc-800 focus:border-zinc-700 transition-colors"
                disabled={submitting}
              />
            </div>

            {/* Inquiry Type Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Inquiry Type
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['Refund Request', 'Subscription Cancellation', 'Billing Question', 'Other'] as InquiryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInquiryType(type)}
                    disabled={submitting}
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200
                      ${inquiryType === type
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-zinc-900/40 text-zinc-400 border-zinc-900 hover:bg-zinc-900 hover:text-white'
                      }
                    `}
                  >
                    {INQUIRY_ICONS[type]}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Subject
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Refund request for order #1234"
                required
                className="h-11 rounded-xl bg-zinc-900/30 border-zinc-800 focus:border-zinc-700 transition-colors"
                disabled={submitting}
                maxLength={100}
              />
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Detailed Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your request in detail. If requesting a refund, please include payment dates and billing transaction details."
                required
                rows={5}
                className="flex w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 resize-none"
                disabled={submitting}
                maxLength={3000}
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-zinc-600 font-mono">
                  {message.length}/3000
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 duration-200 shadow-xl shadow-white/5"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <Footer />
    </main>
  );
}

export default RefundPage;
