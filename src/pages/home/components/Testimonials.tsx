import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Oluwaseun Adeyemi',
    title: 'Business Owner',
    content:
      'Dolu Logistics has made deliveries stress free for my business. Pickups are always on time, communication is clear, and my customers are happier.',
    avatar:
      'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    rating: 5,
  },
  {
    name: 'Chioma Nwosu',
    title: 'Online Seller',
    content:
      'What I love about Dolu Logistics is the care they put into handling parcels. No rushing, no excuses just reliable delivery every time.',
    avatar:
      'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    rating: 5,
  },
  {
    name: 'David Okafor',
    title: 'Store Manager',
    content:
      'Their scheduled pickup service fits perfectly into our daily operations. Dolu Logistics is professional, dependable, and easy to work with.',
    avatar:
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    rating: 4,
  },
];

const Testimonials = () => {
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Individuals and businesses trust Dolu Logistics for swift delivery,
            careful handling, and dependable service.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-background rounded-lg p-6 shadow-md border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-current text-amber-400"
                  />
                ))}
                {[...Array(5 - testimonial.rating)].map((_, i) => (
                  <Star
                    key={i + testimonial.rating}
                    className="w-5 h-5 text-gray-300"
                  />
                ))}
              </div>

              <p className="text-gray-700 mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center mt-2">
                <div className="relative w-12 h-12 mr-4 flex-shrink-0">
                  <span className="absolute inset-0 rounded-full bg-primary-500/40 animate-ping-subtle"></span>
                  <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary-500 text-white font-bold text-lg shadow-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.title}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
