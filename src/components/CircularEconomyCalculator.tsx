import React, { useState } from 'react';
import {
  Wrench,
  Leaf,
  Coins,
  ArrowRight,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Refrigerator,
  Gamepad2,
  CheckCircle2,
  Calculator,
  ShieldAlert,
} from 'lucide-react';

interface DevicePreset {
  id: string;
  name: string;
  icon: any;
  defaultRepairCost: number;
  newAvgCost: number;
  tradeInMax: number;
  co2SavedKg: number;
  commonIssues: { label: string; costModifier: number }[];
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'phone',
    name: 'Smartphone / iPhone',
    icon: Smartphone,
    defaultRepairCost: 69,
    newAvgCost: 899,
    tradeInMax: 1500,
    co2SavedKg: 58,
    commonIssues: [
      { label: 'Ecrã partido / estalado', costModifier: 30 },
      { label: 'Bateria com pouca autonomia', costModifier: 0 },
      { label: 'Porta de carga danificada', costModifier: -20 },
      { label: 'Câmara / lente com falhas', costModifier: 25 },
    ],
  },
  {
    id: 'laptop',
    name: 'Computador Portátil',
    icon: Laptop,
    defaultRepairCost: 89,
    newAvgCost: 1199,
    tradeInMax: 800,
    co2SavedKg: 190,
    commonIssues: [
      { label: 'Lentidão e limpeza de vírus / ventoinhas', costModifier: -10 },
      { label: 'Ecrã avariado ou teclado sem responder', costModifier: 40 },
      { label: 'Upgrade para SSD ultra-rápido + RAM', costModifier: 20 },
      { label: 'Bateria viciada não carrega', costModifier: 15 },
    ],
  },
  {
    id: 'tv',
    name: 'Televisor Smart TV',
    icon: Tv,
    defaultRepairCost: 110,
    newAvgCost: 799,
    tradeInMax: 350,
    co2SavedKg: 240,
    commonIssues: [
      { label: 'Sem imagem ou linhas no painel', costModifier: 35 },
      { label: 'Sem som ou falha nas portas HDMI', costModifier: -15 },
      { label: 'Problema na fonte de alimentação / não liga', costModifier: 10 },
    ],
  },
  {
    id: 'appliance',
    name: 'Máquina de Lavar / Frigorífico',
    icon: Refrigerator,
    defaultRepairCost: 79,
    newAvgCost: 599,
    tradeInMax: 180,
    co2SavedKg: 310,
    commonIssues: [
      { label: 'Não centrifuga / não escoa água', costModifier: 0 },
      { label: 'Barulho anómalo ou correia partida', costModifier: -15 },
      { label: 'Não arrefece / fuga de gás refrigerante', costModifier: 30 },
      { label: 'Borracha da porta rasgada ou fecho', costModifier: -25 },
    ],
  },
  {
    id: 'console',
    name: 'Consola Gaming',
    icon: Gamepad2,
    defaultRepairCost: 65,
    newAvgCost: 499,
    tradeInMax: 290,
    co2SavedKg: 85,
    commonIssues: [
      { label: 'Comando com drift nos analógicos', costModifier: -30 },
      { label: 'Sobreaquecimento e ventoinha ruidosa', costModifier: -10 },
      { label: 'Leitor de discos com erro de leitura', costModifier: 25 },
    ],
  },
];

interface CircularEconomyCalculatorProps {
  onBookService: (serviceDetails: string) => void;
  onOpenChatbot?: () => void;
}

export const CircularEconomyCalculator: React.FC<CircularEconomyCalculatorProps> = ({
  onBookService,
  onOpenChatbot,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);
  const [deviceAgeYears, setDeviceAgeYears] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const currentIssue = selectedDevice.commonIssues[selectedIssueIndex] || selectedDevice.commonIssues[0];
  const calculatedRepairCost = Math.max(39, selectedDevice.defaultRepairCost + currentIssue.costModifier);
  const estimatedSavings = selectedDevice.newAvgCost - calculatedRepairCost;
  const calculatedTradeIn = Math.max(
    45,
    Math.round(selectedDevice.tradeInMax * Math.max(0.2, (5 - deviceAgeYears) / 5))
  );

  const shouldRepair = deviceAgeYears <= 4 && calculatedRepairCost < selectedDevice.newAvgCost * 0.45;

  const handleSimulateAction = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
    }, 4000);
    onBookService(`${selectedDevice.name} - ${currentIssue.label}`);
    if (onOpenChatbot) {
      setTimeout(() => {
        onOpenChatbot();
      }, 800);
    }
  };

  return (
    <section
      id="resolve-calculator"
      className="py-16 bg-[#F4F4F6] text-neutral-900 border-b border-[#E5E5E7] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header from PRD Section 6 */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#DE001A] text-xs font-black uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5" />
            Worten Resolve • Economia Circular
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">
            Reparar ou comprar novo?
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            Reparar é a escolha mais sustentável. Compara e decide com consciência e transparência.
          </p>
        </div>

        {/* Interactive Calculator Shell */}
        <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls: Select device & issues */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Select Device */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-700 block mb-3">
                  1. Seleciona o teu tipo de equipamento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DEVICE_PRESETS.map((dev) => {
                    const IconComponent = dev.icon;
                    const isSelected = dev.id === selectedDevice.id;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => {
                          setSelectedDevice(dev);
                          setSelectedIssueIndex(0);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-red-50 border-2 border-[#DE001A] text-neutral-900 shadow-xs'
                            : 'bg-[#F4F4F6] border-[#E5E5E7] text-neutral-700 hover:bg-white hover:border-[#DE001A]'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-[#DE001A] text-white' : 'bg-white text-neutral-600 border border-[#E5E5E7]'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold truncate">{dev.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Problem / Anomaly */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-neutral-700 block mb-3">
                  2. Qual é a anomalia ou necessidade principal?
                </label>
                <div className="space-y-2">
                  {selectedDevice.commonIssues.map((issue, idx) => (
                    <button
                      key={issue.label}
                      type="button"
                      onClick={() => setSelectedIssueIndex(idx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedIssueIndex === idx
                          ? 'bg-red-50 border-2 border-[#DE001A] text-neutral-900'
                          : 'bg-[#F4F4F6] border-[#E5E5E7] text-neutral-700 hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-[#DE001A]" />
                        {issue.label}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Diagnóstico em Loja
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Device Age Slider */}
              <div className="bg-[#F4F4F6] p-4 rounded-xl border border-[#E5E5E7] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-neutral-700">3. Idade aproximada do aparelho:</span>
                  <span className="text-[#DE001A] font-black">{deviceAgeYears} anos</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={deviceAgeYears}
                  onChange={(e) => setDeviceAgeYears(Number(e.target.value))}
                  className="w-full accent-[#DE001A] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
                  <span>1 ano (recente)</span>
                  <span>3 anos</span>
                  <span>6+ anos (legado)</span>
                </div>
              </div>
            </div>

            {/* Right Verdict Box (Simula Já Verdict) */}
            <div className="lg:col-span-5 bg-[#FAFAFB] p-6 sm:p-7 rounded-2xl border-2 border-red-100 shadow-lg space-y-5 text-neutral-900">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#DE001A]" />
                  Resultado da Simulação
                </span>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-700" />
                  Eco-Decisão
                </span>
              </div>

              {/* Recommendation Badge */}
              <div
                className={`p-4 rounded-xl border text-sm font-bold flex items-start gap-3 ${
                  shouldRepair
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                {shouldRepair ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <Coins className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                )}
                <div>
                  <div className="text-base font-black leading-tight">
                    {shouldRepair
                      ? 'Recomendação: Vale a pena reparar!'
                      : 'Recomendação: Avalia a Retoma Worten!'}
                  </div>
                  <div className="text-xs font-medium text-neutral-700 mt-1 leading-relaxed">
                    {shouldRepair
                      ? `Com um custo estimado de apenas ${calculatedRepairCost}€, poupas cerca de ${estimatedSavings}€ comparando com comprar novo.`
                      : `Dado o desgaste e o custo de reparação, o valor de retoma de até ${calculatedTradeIn}€ torna mais vantajoso o upgrade.`}
                  </div>
                </div>
              </div>

              {/* Financial & Environmental Breakdown */}
              <div className="space-y-2.5 text-xs text-neutral-800">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E5E7] shadow-2xs">
                  <span className="flex items-center gap-2 text-neutral-600 font-medium">
                    <Wrench className="w-4 h-4 text-[#DE001A]" />
                    Custo estimado de reparação:
                  </span>
                  <strong className="text-[#DE001A] text-base font-black">~{calculatedRepairCost}€</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E5E7] shadow-2xs">
                  <span className="flex items-center gap-2 text-neutral-600 font-medium">
                    <Coins className="w-4 h-4 text-amber-600" />
                    Valor estimado de Retoma (Trade-In):
                  </span>
                  <strong className="text-amber-700 text-base font-black">Até {calculatedTradeIn}€</strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E5E7] shadow-2xs">
                  <span className="flex items-center gap-2 text-neutral-600 font-medium">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    CO₂ evitado ao reparar:
                  </span>
                  <strong className="text-emerald-700 text-base font-black">{selectedDevice.co2SavedKg} kg CO₂</strong>
                </div>
              </div>

              {/* Action Button: SIMULA JÁ & Agendamento Chatbot */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="worten-resolve-simulate-cta"
                  type="button"
                  onClick={handleSimulateAction}
                  className="w-full py-3.5 bg-[#DE001A] hover:bg-[#BF0016] active:bg-[#A30013] text-white font-black text-sm rounded-xl transition-all shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Simular & Agendar Reparação</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onOpenChatbot && (
                  <button
                    type="button"
                    onClick={onOpenChatbot}
                    className="w-full py-3 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Falar com Assistente & Agendamento Online</span>
                  </button>
                )}

                {bookingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-900 font-bold animate-in fade-in">
                    ✓ Simulação registada! Leva o equipamento a qualquer loja Worten ou agenda já no assistente virtual.
                  </div>
                )}

                <p className="text-[11px] text-neutral-500 text-center mt-2 font-medium">
                  Peças oficiais, técnicos certificados e 3 anos de garantia nas reparações oficiais Worten Resolve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
