import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Target, FileText, Globe } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (ts: number) => {
      start = start || ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const stats = [
  { icon: Target, value: 92, suffix: "%", label: "Accuracy" },
  { icon: FileText, value: 50, suffix: "K+", label: "Resumes Analyzed" },
  { icon: Globe, value: 120, suffix: "+", label: "Career Fields" },
];

const StatsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="glass-card-hover p-8 text-center"
          >
            <s.icon className="h-8 w-8 text-primary mx-auto mb-4" />
            <div className="font-display text-4xl font-bold gradient-text mb-2">
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </div>
            <p className="text-muted-foreground text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
