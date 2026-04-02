import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ServiceCard from './components/ServiceCard';
import {
  Truck,
  Zap,
  Globe,
  Clock,
  ShoppingBag,
  FileText,
} from 'lucide-react';

// ✅ LOCAL IMAGE IMPORT
import frontBranding from '../../assets/images/FRONTBRANDING.png';

const services = [
  {
    title: 'Scheduled Delivery',
    description: 'Book ahead and choose a convenient pickup time that fits your busy schedule.',
    icon: Clock,
    color: 'text-primary-500',
    bgColor: 'bg-primary-50',
  },
  {
    title: 'Business Delivery',
    description: 'Reliable logistics support for vendors and businesses to reach customers on time.',
    icon: ShoppingBag,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Errand Services',
    description: 'We handle your daily errands, from grocery pickups to simple personal tasks.',
    icon: Truck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Document Delivery',
    description: 'Secure and confidential delivery for all your important paperwork and documents.',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Express Dispatch',
    description: 'Priority delivery service for urgent packages that need immediate attention.',
    icon: Zap,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    title: 'Same-Day Delivery',
    description: 'Guaranteed delivery on the same day for packages within the city limits.',
    icon: Globe,
    color: 'text-accent-500',
    bgColor: 'bg-accent-50',
  },
];

const ServicesPage = () => {
  return (
    <div className="pt-24 pb-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h1>
          <p className="text-lg text-gray-600">
            Dolu Logistics offers customer-friendly delivery solutions for individuals and businesses focused in
            Port Harcourt with reliable nationwide reach.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
              color={service.color}
              bgColor={service.bgColor}
              delay={index * 0.1}
            />
          ))}
        </div>

        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-10">Trusted by Businesses and Individuals</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="h-12 w-24 bg-gray-200 rounded opacity-50"></div>
            <div className="h-12 w-32 bg-gray-200 rounded opacity-50"></div>
            <div className="h-12 w-28 bg-gray-200 rounded opacity-50"></div>
            <div className="h-12 w-36 bg-gray-200 rounded opacity-50"></div>
            <div className="h-12 w-24 bg-gray-200 rounded opacity-50"></div>
          </div>
        </motion.div>

        {/* FAQs Component */}
        <motion.div
          className="mt-24 max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about how our services work.</p>
          </div>
          
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">How fast is Same-Day Delivery?</h4>
              <p className="text-gray-600">If booked before our daily cutoff time, your parcel will be picked up and delivered within the same business day anywhere within Port Harcourt city limits.</p>
            </div>
            <div className="border-b border-gray-100 pb-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Can you handle fragile or high-value items?</h4>
              <p className="text-gray-600">Yes! During booking, you can select 'Fragile' as a tag. Our riders use specialized handling procedures and extra securing materials to ensure safe transit.</p>
            </div>
            <div className="border-b border-gray-100 pb-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Do you offer discounts for wholesale/business vendors?</h4>
              <p className="text-gray-600">Absolutely. Our Business Delivery support offers tailored pricing, scheduled mass-pickups, and dedicated dispatch lines for SMEs and corporate clients.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Is there a package size limit?</h4>
              <p className="text-gray-600">Our bike fleet handles standard parcels, documents, and lightweight goods. For bulky or extremely heavy items, please contact support beforehand to arrange a dedicated vehicle.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-20 bg-primary-500 text-white rounded-lg shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready for Stress Free Delivery?
              </h2>
              <p className="text-lg mb-6">
                Book Dolu Logistics and ship with confidence. We handle your goods with care, deliver on time, and
                charge fairly with clear communication from pickup to drop off.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/request-pickup"
                  className="px-8 py-3 bg-white text-primary-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  Book a Pickup
                </Link>
                <Link
                  to="/track"
                  className="px-8 py-3 bg-accent-500 text-white rounded-md font-medium hover:bg-accent-600 transition-colors"
                >
                  Track Parcel
                </Link>
              </div>
            </div>

            {/* ✅ IMAGE NOW SHOWS ON MOBILE + DESKTOP */}
            <div className="block">
              <img
                src={frontBranding}
                alt="Dolu Logistics branding"
                className="h-64 md:h-full w-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesPage;