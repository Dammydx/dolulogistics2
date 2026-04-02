import { motion } from 'framer-motion';
import { Zap, Globe, Clock, ShoppingBag, FileText } from 'lucide-react';
import DispatchBikeIcon from '../../../components/icons/DispatchBikeIcon';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Scheduled Delivery',
    description: 'Book ahead and choose a convenient pickup time that fits your busy schedule.',
    icon: Clock,
    color: 'bg-primary-500',
  },
  {
    title: 'Business Delivery',
    description: 'Reliable logistics support for vendors and businesses to reach customers on time.',
    icon: ShoppingBag,
    color: 'bg-emerald-500',
  },
  {
    title: 'Errand Services',
    description: 'We handle your daily errands, from grocery pickups to simple personal tasks.',
    icon: DispatchBikeIcon,
    color: 'bg-amber-500',
  },
  {
    title: 'Document Delivery',
    description: 'Secure and confidential delivery for all your important paperwork and documents.',
    icon: FileText,
    color: 'bg-blue-500',
  },
  {
    title: 'Express Dispatch',
    description: 'Priority delivery service for urgent packages that need immediate attention.',
    icon: Zap,
    color: 'bg-red-500',
  },
  {
    title: 'Same-Day Delivery',
    description: 'Guaranteed delivery on the same day for packages within the city limits.',
    icon: Globe,
    color: 'bg-accent-500',
  },
];

const ServiceHighlights = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-lg text-gray-600">
            Dolu Logistics delivers swiftly, handles goods with care, and keeps pricing clear
            for individuals and businesses.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={`h-2 ${service.color}`}></div>

              <div className="p-6">
                <div className="mb-4">
                  <service.icon className="w-8 h-8 text-text" />
                </div>

                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link
            to="/services"
            className="px-6 py-3 bg-primary-500 text-white rounded-md font-medium hover:bg-primary-600 transition-colors inline-block"
          >
            View All Services
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ServiceHighlights;
