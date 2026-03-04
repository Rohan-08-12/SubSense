"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { motion } from "framer-motion";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

const features = [
  {
    icon: "🏦",
    title: "Bank Integration",
    desc: "Securely connect your bank accounts via Plaid for automatic transaction monitoring.",
  },
  {
    icon: "🔍",
    title: "Auto-Detection",
    desc: "Our smart engine detects recurring charges and identifies your subscriptions automatically.",
  },
  {
    icon: "📊",
    title: "Spending Insights",
    desc: "Visualize your monthly and yearly subscription spend with beautiful, interactive charts.",
  },
  {
    icon: "🔔",
    title: "Stay Informed",
    desc: "Track billing dates, amounts, and statuses — never be surprised by a charge again.",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    const resetEvent = new Event("resetSection");
    window.dispatchEvent(resetEvent);
  }, []);

  return (
    <main className="bg-white dark:bg-gray-950">
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1280&auto=format&fit=crop"
        bgImageSrc="https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=1920&auto=format&fit=crop"
        title="Take Control"
        date="SubSense"
        scrollToExpand="Scroll to explore"
        textBlend={false}
      >
        <div className="w-full flex flex-col items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mt-8">
            <div className="text-center mb-24">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
                Stay on top of <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  everything you pay for
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                SubSense connects to your bank, automatically detects recurring
                charges, and gives you a crystal-clear view of every subscription
                you&apos;re paying for.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      Get Started — It&apos;s Free
                    </Link>
                    <Link
                      href="/login"
                      className="px-8 py-4 text-lg font-semibold rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all bg-white dark:bg-gray-900"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mb-24">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-900 dark:text-white">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  track smarter
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((f, i) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{f.icon}</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                      {f.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mb-16 p-12 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Ready to stop overpaying?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Join SubSense and get full visibility into where your money goes
                every month.
              </p>
              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="inline-block px-8 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                >
                  Create Your Free Account
                </Link>
              )}
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-16 flex flex-col items-center">
              <div className="text-sm text-gray-500 dark:text-gray-500">
                © {new Date().getFullYear()} SubSense. All rights reserved.
              </div>
            </footer>
          </div>
        </div>
      </ScrollExpandMedia>
    </main>
  );
}
