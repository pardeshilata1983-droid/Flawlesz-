import React from 'react';
import { ArrowLeft, Shield, Lock, Calendar, Eye, Database, Server, Cookie, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Footer } from '../components/Footer.tsx';

interface PrivacyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111111] flex flex-col justify-between selection:bg-[#E8481C] selection:text-white">
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

        {/* Template Review Notice Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-950">
                Template Notice — Review Required Before Publication
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                This Privacy Policy is an engineering draft generated directly from the technical codebase inventory of Flawlesz AI (forms, cookies, local storage keys, and third-party integrations). It must be reviewed, customized, and approved by your legal counsel to ensure compliance with applicable regulations in your specific operating jurisdictions.
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="border-b border-[#E0DEDA] pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/5 text-[#111111] text-xs font-mono mb-4">
            <Shield className="w-3.5 h-3.5 text-[#E8481C]" />
            <span>Privacy & Data Governance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs font-mono text-[#5A5A5A] flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Updated: October 7, 2026 • Effective Date: October 7, 2026</span>
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-10 text-[14px] sm:text-[15px] leading-relaxed text-[#222222]">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">
              1. Introduction
            </h2>
            <p>
              At <strong>Flawlesz AI</strong> ("we", "our", or "us"), safeguarding the confidentiality of your startup hypotheses, proprietary concept notes, and personal data is central to our platform. This Privacy Policy details the exact data we collect, why we collect it, how it is processed, and your privacy rights under applicable data protection laws (including the EU GDPR, UK GDPR, and Swiss FADP).
            </p>
            <p>
              Our policy is strictly grounded in what our application codebase actually captures and processes. We do not sell your personal data to data brokers or third-party advertisers.
            </p>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 2: Code Inventory */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#E8481C]" />
              <span>2. Technical Inventory: Forms & Data Collected</span>
            </h2>
            <p>
              Our application collects data across the following specific forms and interfaces:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <h3 className="font-bold text-xs font-mono uppercase text-[#111111]">A. Contact & Customer Support Form (/contact)</h3>
                <p className="text-xs text-[#555555]">
                  <strong>Fields Captured:</strong> Full Name, Email Address, Inquiry Category (Billing, Technical, Tiers, Privacy, General), and Message body.
                </p>
                <p className="text-xs text-[#555555]">
                  <strong>Purpose:</strong> Responding to user support inquiries, logging tickets, and resolving billing or technical requests.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <h3 className="font-bold text-xs font-mono uppercase text-[#111111]">B. Account Registration & Authentication Forms (/signup, /login)</h3>
                <p className="text-xs text-[#555555]">
                  <strong>Fields Captured:</strong> Email address, cryptographically salted password hash (SHA-512 with random salt), and name. For Google Sign-In, we receive the user's verified Google email address and public profile name.
                </p>
                <p className="text-xs text-[#555555]">
                  <strong>Purpose:</strong> Creating and securing user accounts, authenticating sessions, and enforcing subscription quotas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <h3 className="font-bold text-xs font-mono uppercase text-[#111111]">C. Onboarding Questionnaire (/onboarding)</h3>
                <p className="text-xs text-[#555555]">
                  <strong>Fields Captured:</strong> User persona classification (Student, Working Professional, Founder, Hobbyist), referral channel, project category, and idea development stage.
                </p>
                <p className="text-xs text-[#555555]">
                  <strong>Purpose:</strong> Tailoring validation depth, risk analysis benchmarks, and initial telemetry to the founder's experience level.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <h3 className="font-bold text-xs font-mono uppercase text-[#111111]">D. Idea Validator & File Attachments (/submit)</h3>
                <p className="text-xs text-[#555555]">
                  <strong>Fields Captured:</strong> Startup pitch descriptions, problem statements, optional pitch deck uploads (PDF/text extracted in-memory), speech audio transcripts, and model tier selection (Orbit, Pulsar, Quasar).
                </p>
                <p className="text-xs text-[#555555]">
                  <strong>Ownership:</strong> You retain 100% exclusive intellectual property ownership of all concepts and documents submitted. Flawlesz AI does not claim ownership or license rights over user ideas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <h3 className="font-bold text-xs font-mono uppercase text-[#111111]">E. Account Settings & Security (/account)</h3>
                <p className="text-xs text-[#555555]">
                  <strong>Fields Captured:</strong> Profile name updates, notification preferences, and password change credentials.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 3: Cookies & Local Storage */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
              <Cookie className="w-5 h-5 text-[#E8481C]" />
              <span>3. Cookies & Browser Local Storage</span>
            </h2>
            <p>
              We distinguish between essential storage keys required for authentication and security, and optional analytics cookies:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#E0DEDA] rounded-xl overflow-hidden">
                <thead className="bg-[#FAF9F6] border-b border-[#E0DEDA] font-mono uppercase text-[#555555]">
                  <tr>
                    <th className="p-3">Key / Cookie Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DEDA] bg-white">
                  <tr>
                    <td className="p-3 font-mono font-semibold">flaw_auth_token</td>
                    <td className="p-3">LocalStorage (Essential)</td>
                    <td className="p-3">Persistent until logout</td>
                    <td className="p-3">Maintains authenticated user session across page reloads.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold">flaw_auth_user</td>
                    <td className="p-3">LocalStorage (Essential)</td>
                    <td className="p-3">Persistent until logout</td>
                    <td className="p-3">Caches user profile and active tier entitlements.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold">flaw_cookie_consent</td>
                    <td className="p-3">LocalStorage (Essential)</td>
                    <td className="p-3">1 Year</td>
                    <td className="p-3">Stores the user's cookie consent choice (accepted/declined).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold">_ga, _ga_XXXXXXXXXX</td>
                    <td className="p-3">HTTP Cookie (Analytics)</td>
                    <td className="p-3">Up to 2 Years</td>
                    <td className="p-3">Google Analytics 4 cookies used to calculate visitor and session data. Loaded only with consent in EU/UK/CH.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-semibold">flaw_validator_selected_model</td>
                    <td className="p-3">LocalStorage (Preference)</td>
                    <td className="p-3">Persistent</td>
                    <td className="p-3">Remembers chosen model tier (Orbit, Pulsar, Quasar) for seamless workflow.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 4: Google Analytics 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">
              4. Google Analytics 4 (GA4)
            </h2>
            <p>
              We integrate Google Analytics 4 (Measurement ID: <code>G-XXXXXXXXXX</code>) provided by Google LLC. GA4 helps us understand user navigation patterns, page performance, and key event conversions (such as verified form submissions).
            </p>
            <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-2 text-xs">
              <div className="font-semibold text-[#111111]">Privacy Controls & Consent:</div>
              <ul className="list-disc pl-5 space-y-1 text-[#555555]">
                <li><strong>Strict Prior Consent:</strong> For visitors accessing from the European Union, United Kingdom, and Switzerland, GA4 scripts are disabled by default and load only after you click "Accept Cookies" on our banner.</li>
                <li><strong>IP Anonymization:</strong> IP anonymization is permanently enabled on all tracked sessions.</li>
                <li><strong>Key Events:</strong> Visits to our confirmation page (/thank-you) trigger an anonymized key event to record successful inquiries without transmitting personal information.</li>
                <li><strong>Opt-Out:</strong> You can decline analytics on our consent banner or install the Google Analytics Opt-Out Browser Add-on.</li>
              </ul>
            </div>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 5: Third-Party Processors */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-[#E8481C]" />
              <span>5. Third-Party Service Providers</span>
            </h2>
            <p>
              We partner with trusted third-party service providers under strict data privacy obligations:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <div className="font-bold text-[#111111]">Google Gemini API (@google/genai)</div>
                <p className="text-[#555555]">
                  Powers idea validation, flaw extraction, and AI Teammates reasoning. Data submitted via API requests is processed server-side in compliance with Google Cloud enterprise terms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <div className="font-bold text-[#111111]">Razorpay Payment Gateway</div>
                <p className="text-[#555555]">
                  Processes subscription billing directly in an encrypted PCI-DSS Level 1 environment. Flawlesz AI never receives or stores your full credit card number, CVV, or banking PINs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <div className="font-bold text-[#111111]">Google Workspace / OAuth</div>
                <p className="text-[#555555]">
                  Facilitates optional federated sign-in. We only receive basic account verification tokens (email and display name) without access to private Google Workspace drives.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1.5">
                <div className="font-bold text-[#111111]">CloudFront & Web Push</div>
                <p className="text-[#555555]">
                  Provides secure content delivery for media assets and encrypted browser push notifications for subscribers who opt in.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 6: Security, Retention & User Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">
              6. Data Security, Retention & Your Rights
            </h2>
            <p>
              We implement industry-standard encryption, strict access controls, and rate limiting to safeguard user data. Under GDPR, CCPA, and applicable laws, you retain the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#444444]">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete profile details via your Account Settings.</li>
              <li><strong>Deletion ("Right to be Forgotten"):</strong> Request the complete deletion of your account and associated validation history.</li>
              <li><strong>Export:</strong> Download your validation history and Vibe Code project files as ZIP archives.</li>
            </ul>
          </section>

          <hr className="border-[#E0DEDA]" />

          {/* Section 7: Contact */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#111111] tracking-tight">
              7. Contact & Privacy Inquiries
            </h2>
            <p>
              If you have any questions about this Privacy Policy, wish to exercise your data protection rights, or need assistance, please contact our privacy officer:
            </p>
            <div className="p-4 rounded-xl bg-white border border-[#E0DEDA] space-y-1 text-xs font-mono">
              <p><strong>Email:</strong> privacy@flaw.app</p>
              <p><strong>Support Ticket:</strong> <button onClick={() => onNavigate('/flaw/contact')} className="text-[#E8481C] underline cursor-pointer">Submit Contact Request</button></p>
              <p><strong>Response Time:</strong> Within 24–48 business hours</p>
            </div>
          </section>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
