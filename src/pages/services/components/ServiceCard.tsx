import { motion } from 'framer-motion';

type ServiceCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  delay?: number;
};

const ServiceCard = ({
  title,
  description,
  icon: Icon,
  color,
  bgColor,
  delay = 0,
}: ServiceCardProps) => {
  return (
    <motion.div
      className="bg-white rounded-lg overflow-hidden flex flex-col shadow-md hover:shadow-lg transition-shadow min-h-[260px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="p-8 flex-1 flex flex-col">
        <div className={`w-14 h-14 rounded-lg ${bgColor} flex items-center justify-center mb-5`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>

        <p className="text-gray-700 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
