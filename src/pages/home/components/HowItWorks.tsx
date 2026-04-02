import { motion } from 'framer-motion';
import { Package, MapPin, Check } from 'lucide-react';
import DispatchBikeIcon from '../../../components/icons/DispatchBikeIcon';

const steps = [
  {
    title: 'Book a Pickup',
    description:
      'Request a pickup in minutes. Share your pickup and drop-off details and we’ll handle the rest.',
    icon: Package,
    color: 'bg-primary-50 text-primary-500',
  },
  {
    title: 'Swift Collection',
    description:
      'A trained Dolu rider arrives on time, confirms your package details, and picks it up with care.',
    icon: DispatchBikeIcon,
    color: 'bg-accent-50 text-accent-500',
  },
  {
    title: 'Track & Stay Updated',
    description:
      'Follow your delivery and get clear updates from pickup to drop-off — no stress, no guessing.',
    icon: MapPin,
    color: 'bg-amber-50 text-amber-500',
  },
  {
    title: 'Safe Delivery',
    description:
      'Your package gets delivered safely and on time, with confirmation of delivery for peace of mind.',
    icon: Check,
    color: 'bg-emerald-50 text-emerald-500',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Dolu Works</h2>
          <p className="text-lg text-gray-600">
            A simple, customer-friendly process built for swift delivery, careful handling, and peace of mind.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Step card */}
              <div className="bg-white rounded-lg p-6 shadow-md h-full border border-gray-100 hover:shadow-lg transition-shadow">
                <div
                  className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-4`}
                >
                  <step.icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-200"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
