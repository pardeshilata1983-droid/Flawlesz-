import React from 'react';
import { ArrowLeft, Shield, FileText, Calendar, Scale, Mail } from 'lucide-react';
import { Footer } from '../components/Footer.tsx';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex flex-col justify-between">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Back navigation */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('/flaw')}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#5A5A5A] hover:text-[#111111] transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
        </div>

        {/* Header */}
        <div className="border-b border-[#E0DEDA] pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/5 text-[#111111] text-xs font-mono mb-4">
            <Scale className="w-3.5 h-3.5 text-[#E8481C]" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            Terms and Conditions
          </h1>
          <p className="mt-2 text-sm text-[#5A5A5A] font-mono flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Updated: September 24, 2026 • Effective Date: September 24, 2026</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-[15px] leading-relaxed text-[#222222]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              1. Acceptance of Terms & Description of Service
            </h2>
            <p>
              Welcome to <strong>Flawlesz AI</strong> ("we", "our", or "us"). Flawlesz AI is an AI-powered software application that provides automated idea validation, critical market stress-testing, competitor research grounding, and risk diagnostic analysis for entrepreneurs, product teams, and creators.
            </p>
            <p>
              By accessing, browsing, registering for an account, or purchasing a subscription on Flawlesz AI (the "Service"), you ("User", "Customer", or "You") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to all terms and conditions outlined herein, you must immediately discontinue use of the Service.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              2. Eligibility & Account Registration
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Age & Capacity:</strong> You must be at least 18 years of age (or the age of legal majority in your jurisdiction) and legally capable of entering into binding contracts to register an account and use the Service.
              </li>
              <li>
                <strong>Account Accuracy:</strong> You agree to provide accurate, current, and complete information during registration and keep your account details updated.
              </li>
              <li>
                <strong>Credential Confidentiality:</strong> You are responsible for safeguarding your password and account credentials. You agree to notify us immediately at <a href="mailto:support@flaw.app" className="text-[#E8481C] underline underline-offset-2">support@flaw.app</a> upon discovering any unauthorized use or security breach.
              </li>
            </ul>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              3. Acceptable Use Policy
            </h2>
            <p>When using Flawlesz AI, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submit content that is illegal, defamatory, harmful, infringes on third-party intellectual property, or violates applicable local or international laws;</li>
              <li>Attempt to decompile, reverse-engineer, disassemble, or extract source code from the Service;</li>
              <li>Deploy automated bots, scrapers, crawlers, or load-testing scripts that disrupt service stability or circumvent rate limits;</li>
              <li>Resell, sublicense, or rent direct API access to third parties without prior written authorization from Flawlesz AI;</li>
              <li>Use the platform to develop or train competing automated idea-critique software in violation of our intellectual property.</li>
            </ul>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              4. Subscription Plans, Billing & Auto-Renewal
            </h2>
            <p>
              Flawlesz AI offers tiered access plans (including Orbit, Pulsar, and Quasar tiers) designed with varying usage quotas, priority processing, and advanced diagnostic capabilities.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Billing Cycle & Payment:</strong> Paid subscriptions are billed in advance on a recurring monthly or annual basis via our secure payment gateway partner, <strong>Razorpay</strong>.
              </li>
              <li>
                <strong>Automatic Renewal:</strong> Unless cancelled prior to the end of the current billing cycle, your subscription will automatically renew at the then-prevailing subscription fee using your designated payment method.
              </li>
              <li>
                <strong>Taxes:</strong> All fees are exclusive of applicable goods and services taxes (GST) or statutory duties unless explicitly stated otherwise during checkout.
              </li>
              <li>
                <strong>Price Modifications:</strong> We reserve the right to revise subscription pricing upon giving at least 30 days prior notice via email or platform notification before your next renewal.
              </li>
            </ul>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              5. User Content & Intellectual Property Rights
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Ownership of User Ideas:</strong> You retain 100% full and exclusive ownership of all concepts, startup ideas, documents, transcripts, and proprietary text ("User Content") submitted to the Service. Flawlesz AI claims no intellectual property rights or ownership over your ideas.
              </li>
              <li>
                <strong>Limited Processing License:</strong> You grant Flawlesz AI a non-exclusive, worldwide, royalty-free license solely to transmit, process, and analyze your User Content through our computational and AI models to generate validation diagnostics and reports for your account.
              </li>
              <li>
                <strong>Flawlesz AI Platform IP:</strong> The Flawlesz AI application, brand name, trademarks, user interface design, diagnostic algorithms, software code, and reporting frameworks are the exclusive intellectual property of Flawlesz AI and its licensors.
              </li>
            </ul>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              6. AI Output & Advisory Disclaimer
            </h2>
            <p>
              <strong>Informational & Diagnostic Purpose Only:</strong> The validation analyses, risk scores, market observations, competitor comparisons, and flaw identification reports generated by the Service are computational outputs produced using artificial intelligence models and search grounding.
            </p>
            <p>
              They are provided strictly for informational, educational, and brainstorming purposes. Flawlesz AI does not provide certified financial, legal, investment, regulatory, or business management advice. You are solely responsible for verifying facts and conducting independent due diligence before committing financial capital, signing contracts, or making business decisions.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              7. Limitation of Liability & Warranty Disclaimer
            </h2>
            <p>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, statutory, or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              To the maximum extent permitted by applicable law, in no event shall Flawlesz AI, its founders, affiliates, employees, or partners be liable for any indirect, incidental, punitive, special, or consequential damages, or loss of profits, data, goodwill, or business opportunities arising out of or related to your use of or inability to use the Service. Our aggregate liability shall not exceed the amount paid by you to Flawlesz AI during the twelve (12) months preceding the claim.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              8. Account Termination & Cancellation
            </h2>
            <p>
              You may cancel your subscription at any time via the platform's <button onClick={() => onNavigate('/flaw/billing')} className="text-[#E8481C] underline underline-offset-2">Billing Page</button> or by contacting customer support. Upon cancellation, your subscription remains active until the expiration of the current paid billing period.
            </p>
            <p>
              We reserve the right to suspend or terminate your account immediately without prior notice if you breach these Terms, engage in fraudulent payment activity, or violate our Acceptable Use Policy.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              9. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them or their subject matter shall be governed by and construed in accordance with the laws of <strong>India</strong>, without giving effect to any principles of conflicts of law.
            </p>
            <p>
              You agree that the competent courts situated in India shall have exclusive jurisdiction over any legal proceedings arising out of or related to these Terms or the Service.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
              10. Contact Information
            </h2>
            <p>
              If you have any questions, grievances, or legal notices regarding these Terms, please reach out to us:
            </p>
            <div className="p-4 rounded-lg bg-white border border-[#E0DEDA] space-y-1.5 font-mono text-xs">
              <p><strong>Entity Name:</strong> Flaw Validation Technologies</p>
              <p><strong>Email:</strong> <a href="mailto:support@flaw.app" className="text-[#E8481C] underline">support@flaw.app</a> / <a href="mailto:legal@flaw.app" className="text-[#E8481C] underline">legal@flaw.app</a></p>
              <p><strong>Support Page:</strong> <button onClick={() => onNavigate('/flaw/contact')} className="text-[#E8481C] underline">flaw.app/contact</button></p>
              <p><strong>Jurisdiction:</strong> India</p>
            </div>
          </section>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
