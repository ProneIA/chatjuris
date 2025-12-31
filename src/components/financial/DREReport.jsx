import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function DREReport({ receitas, despesas, despesasDetalhadas = [], theme = 'light' }) {
  const isDark = theme === 'dark';

  // Agrupar despesas por categoria
  const despesasPorCategoria = despesasDetalhadas.reduce((acc, d) => {
    if (!acc[d.categoria]) acc[d.categoria] = 0;
    acc[d.categoria] += d.valor;
    return acc;
  }, {});

  const receitaBruta = receitas;
  const despesasOperacionais = despesas;
  const lucroOperacional = receitaBruta - despesasOperacionais;
  const margemLucro = receitaBruta > 0 ? ((lucroOperacional / receitaBruta) * 100).toFixed(1) : 0;

  const categoriaLabels = {
    aluguel: 'Aluguel',
    funcionarios: 'Funcionários',
    tecnologia: 'Tecnologia',
    marketing: 'Marketing',
    despachante: 'Despachante',
    custas_processuais: 'Custas Processuais',
    fornecedores: 'Fornecedores',
    impostos: 'Impostos',
    outros: 'Outros'
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    doc.setFontSize(18);
    doc.text('DRE - Demonstração do Resultado do Exercício', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Data: ${hoje}`, 20, 30);
    
    doc.setFontSize(12);
    let y = 45;
    
    doc.text('RECEITAS', 20, y);
    y += 8;
    doc.text(`Honorários Advocatícios: R$ ${receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
    y += 10;
    
    doc.text('(-) DESPESAS OPERACIONAIS', 20, y);
    y += 8;
    Object.entries(despesasPorCategoria).forEach(([cat, valor]) => {
      doc.text(`${categoriaLabels[cat]}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
      y += 6;
    });
    y += 4;
    doc.text(`Total Despesas: R$ ${despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, y);
    y += 12;
    
    doc.setFontSize(14);
    doc.text(`LUCRO OPERACIONAL: R$ ${lucroOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Margem de Lucro: ${margemLucro}%`, 20, y);
    
    doc.save('DRE.pdf');
    toast.success('DRE exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          DRE - Demonstração do Resultado do Exercício
        </h2>
        <Button onClick={exportPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className="text-base">Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Receitas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                RECEITAS
              </span>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex items-center justify-between pl-4 py-2 border-l-2 border-green-600">
              <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                Honorários Advocatícios
              </span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                R$ {receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Despesas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                (-) DESPESAS OPERACIONAIS
              </span>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-red-600">
              {Object.entries(despesasPorCategoria).map(([cat, valor]) => (
                <div key={cat} className="flex items-center justify-between py-1">
                  <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                    {categoriaLabels[cat]}
                  </span>
                  <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                    R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 border-t mt-2">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Total Despesas
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  R$ {despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className={`p-4 rounded-lg ${
            lucroOperacional >= 0 
              ? (isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200')
              : (isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200')
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                LUCRO OPERACIONAL
              </span>
              <span className={`text-2xl font-bold ${lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {lucroOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>Margem de Lucro</span>
              <span className={`font-semibold ${lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {margemLucro}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}