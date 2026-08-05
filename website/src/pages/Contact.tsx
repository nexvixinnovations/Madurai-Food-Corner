import React, { useState } from 'react';
import { Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const mailtoLink = `mailto:MaduraiFoodCorner@gmail.com?subject=Inquiry from ${encodeURIComponent(name)}&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0APhone: ${encodeURIComponent(phone)}%0AMessage: ${encodeURIComponent(message)}`;

      toast.success('Message sent successfully! Opening email client...');
      window.location.href = mailtoLink;

      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-4xl font-extrabold font-serif text-brand-maroon dark:text-white">
            Contact Us
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Have a question or custom catering request? Get in touch with Madurai Food Corner.
          </p>
        </div>

        {/* Arranged Side-by-Side Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Info Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-brand-maroon via-brand-maroon-dark to-black text-white p-8 rounded-3xl space-y-8 shadow-xl border border-amber-500/20 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img
                  src="/logo.png"
                  alt="Madurai Food Corner Logo"
                  className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold font-serif text-amber-400">Madurai Food Corner</h3>
                  <p className="text-xs text-amber-200 uppercase tracking-widest font-semibold mt-0.5">
                    Authentic South Indian Cuisine
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                We are dedicated to serving you authentic, freshly cooked South Indian dishes prepared with natural ingredients and traditional recipes.
              </p>

              <div className="p-5 rounded-2xl bg-white/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Customer Support Phone</p>
                    <p className="text-amber-400 font-extrabold text-sm mt-0.5">9952250435 / 7708382018</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-[11px] text-zinc-400">
              For online ordering, catering orders, and instant assistance, reach us directly via phone.
            </div>
          </div>

          {/* Right Send Message Form Card */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold font-serif text-brand-maroon dark:text-white mb-2">
                Send Us a Message
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                Fill in the form below to submit your inquiry directly to our team.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                      placeholder="Your Full Name"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                    placeholder="Your Phone Number"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-brand-maroon font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
