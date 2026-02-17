import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Aarav Sharma", role: "Software Developer, TCS", text: "SkillMirror AI completely transformed my job search. The skill gap analysis pinpointed exactly what I was missing, and within 3 weeks of following the roadmap, I cracked an interview at a product-based company. Highly recommend it!" },
  { name: "Sneha Patil", role: "Data Analyst, Infosys", text: "I was struggling with ATS rejections for months. SkillMirror's resume rewrite suggestions boosted my ATS score from 38% to 91%. I received 4 interview calls within a week of updating my resume. This tool is a must-have!" },
  { name: "Rohan Deshmukh", role: "Full Stack Developer", text: "The 30-day career roadmap was exactly what I needed. It gave me a clear, actionable plan — from certifications to projects. I followed it religiously and landed a role at a top startup in Pune. Absolutely worth it." },
  { name: "Kavya Nair", role: "UI/UX Designer, Wipro", text: "As a designer transitioning into product management, SkillMirror showed me the exact skills I was missing and suggested perfect projects to build. The AI career strategy section is pure gold. Thank you, SkillMirror!" },
  { name: "Vikram Joshi", role: "DevOps Engineer, Accenture", text: "I used SkillMirror before my performance review and it helped me identify my strengths and weaknesses objectively. The salary insights were spot-on for the Indian market. Best career tool I've used so far." },
  { name: "Ananya Kulkarni", role: "ML Engineer, Persistent Systems", text: "The AI-powered analysis is incredibly detailed. It not only showed my match score but also recommended certifications and projects that directly aligned with my dream role. Got placed in just 2 months of using this!" },
];

const TestimonialsSection = () => (
  <section className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-16">
        What Users <span className="gradient-text">Say</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
