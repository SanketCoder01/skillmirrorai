import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Aarav Sharma", role: "Software Developer, TCS", text: "SkillMirror helped me understand my skill gaps. Within 3 weeks of following the roadmap, I got placed at a product-based company. Simple and effective!" },
  { name: "Sneha Patil", role: "Data Analyst, Infosys", text: "My ATS score jumped from 38% to 91% after using the resume optimizer. I received 4 interview calls in just one week. Highly recommended!" },
  { name: "Rohan Deshmukh", role: "Full Stack Developer", text: "The career roadmap gave me a clear plan. I followed it and landed a role at a top startup in Pune. Best career tool I've used." },
];

const TestimonialsSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16">
        What Users <span className="gradient-text">Say</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="glass-card-hover p-6"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">"{t.text}"</p>
            <div>
              <p className="font-semibold text-foreground text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.role}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
