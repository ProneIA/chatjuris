import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Ricardo Almeida",
    role: "Advogado Cível | OAB/SP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "O Juris IA transformou minha rotina. Documentos que levavam 3 horas agora ficam prontos em 15 minutos. Minha produtividade triplicou e posso focar no que realmente importa: atender melhor meus clientes."
  },
  {
    name: "Dra. Marina Santos",
    role: "Advogada Trabalhista | OAB/RJ",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "A análise de documentos é impressionante. A LEXIA identificou cláusulas problemáticas em contratos que eu provavelmente teria deixado passar. Ferramenta indispensável para qualquer escritório moderno."
  },
  {
    name: "Dr. Carlos Eduardo",
    role: "Advogado Empresarial | OAB/MG",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Investir no plano Pro foi a melhor decisão que tomei este ano. O ROI é absurdo - economizo mais de R$ 3.000 por mês em tempo. A pesquisa de jurisprudência então, nem se fala. Revolucionário!"
  },
  {
    name: "Dra. Fernanda Lima",
    role: "Advogada de Família | OAB/PR",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Comecei com o plano gratuito e em uma semana já estava assinando o Pro. A qualidade dos documentos gerados é excepcional. Meus colegas não acreditam que uso IA - o texto parece 100% humano."
  },
  {
    name: "Dr. André Oliveira",
    role: "Advogado Tributarista | OAB/BA",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "O suporte é excelente e a plataforma está sempre evoluindo. Cada atualização traz algo novo e útil. Finalmente uma empresa de tecnologia que entende as necessidades reais do advogado brasileiro."
  }
];

export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative">
      {/* Desktop: Show 3 cards */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {[0, 1, 2].map((offset) => {
          const idx = (currentIndex + offset) % testimonials.length;
          const testimonial = testimonials[idx];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: offset * 0.1 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Show 1 card */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <TestimonialCard testimonial={testimonials[currentIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? "bg-blue-600 w-8" 
                  : "bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={next}
          className="rounded-full"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <Card className="h-full bg-white border-slate-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <Quote className="w-8 h-8 text-blue-100 mb-4" />
        
        <div className="flex gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          ))}
        </div>

        <p className="text-slate-700 mb-6 leading-relaxed">
          "{testimonial.text}"
        </p>

        <div className="flex items-center gap-3">
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{testimonial.name}</p>
            <p className="text-sm text-slate-500">{testimonial.role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}