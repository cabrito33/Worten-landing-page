import React, { useState } from 'react';
import {
  Wrench,
  Smartphone,
  Laptop,
  Paintbrush,
  Hammer,
  Shield,
  Refrigerator,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { LOCAL_SERVICES } from '../data/landingData';

interface ServicesMatrixProps {
  onBookService: (serviceName: string) => void;
}

export const ServicesMatrix: React.FC<ServicesMatrixProps> = ({ onBookService }) => {
  const [bookedService, setBookedService] = useState<string | null>(null);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Refrigerator':
        return Refrigerator;
      case 'Smartphone':
        return Smartphone;
      case 'Laptop':
        return Laptop;
      case 'Paintbrush':
        return Paintbrush;
      case 'Hammer':
        return Hammer;
      case 'Shield':
      default:
        return Shield;
    }
  };

  const handleBooking = (name: string) => {
    setBookedService(name);
    onBookService(name);
    setTimeout(() => {
      setBookedService(null);
    }, 4000);
  };

  return (
    <section id="servicos" className="py-16 bg-[#F4F4F6] border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5" />
              Descobre mais serviços | Rede Especializada
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Mais de 250 técnicos para cuidar do teu lar
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl font-medium">
              Esquece as complicações de montagens e canalizações. A rede Worten Resolve instala, repara e protege os teus equipamentos com garantia certificada.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#DE001A]" />
              Linha de Apoio Técnico: 210 155 222
            </span>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LOCAL_SERVICES.map((service) => {
            const IconComp = getServiceIcon(service.icon);
            const isBooked = bookedService === service.name;

            return (
              <div
                key={service.id}
                className="p-6 rounded-2xl bg-white border border-[#E5E5E7] hover:border-[#DE001A] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-[#DE001A] flex items-center justify-center border border-red-200 shadow-2xs">
                      <IconComp className="w-6 h-6" />
                    </div>
                    {service.popular && (
                      <span className="text-[10px] font-black uppercase bg-[#DE001A] text-white px-2.5 py-1 rounded-full shadow-2xs">
                        Mais Solicitado
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-neutral-900">
                      {service.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed font-medium">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E5E5E7] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-neutral-900 text-sm">
                      {service.priceStartingAt}
                    </span>
                    <span className="text-neutral-500 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      {service.timeframe}
                    </span>
                  </div>

                  <button
                    onClick={() => handleBooking(service.name)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      isBooked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#DE001A] hover:bg-[#BF0016] text-white'
                    }`}
                  >
                    {isBooked ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Pedido Registado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <span>Solicitar Técnico / Orçamento</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
