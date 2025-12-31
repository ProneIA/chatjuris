import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function FluxoCaixaReport({ parcelas = [], despesas = [], theme = 'light' }) {
  const isDark = theme === 'dark';
  const [periodo, setPeriodo] = useState('30'); // dias

  const hoje = new Date();
  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() + parseInt(periodo));

  // Filtrar por período
  const parcelasFuturas = parcelas.filter(p => {
    const venc = new Date(p.data_vencimento);
    return venc >= hoje && venc <= dataLimite && p.status !== 'pago';
  });

  const despesasFuturas = despesas.filter(d => {
    const venc = new Date(d.data_vencimento);
    return venc >= hoje && venc <= dataLimite && d.status !== 'pago';
  });

  // Totais
  const entradas = parcelasFuturas.reduce((sum, p) => sum + (p.valor || 0), 0);
  const saidas = despesasFuturas.reduce((sum, d) => sum + (d.valor || 0), 0);
  const saldoProjetado = entradas - saidas;

  // Consolidar por data
  const consolidado = {};
  
  parcelasFuturas.forEach(p => {
    const data = p.data_vencimento;
    if (!consolidado[data]) consolidado[data] = { entradas: 0, saidas: 0 };
    consolidado[data].entradas += p.valor;
  });

  despesasFuturas.forEach(d => {
    const data = d.data_vencimento;
    if (!consolidado[data]) consolidado[data] = { entradas: 0, saidas: 0 };
    consolidado[data].saidas += d.valor;
  });

  const fluxoOrdenado = Object.entries(consolidado)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([data, valores]) => ({
      data,
      entradas: valores.entradas,
      saidas: valores.saidas,
      saldo: valores.entradas - valores.saidas
    }));

  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Fluxo de Caixa Projetado', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Período: Próximos ${periodo} dias`, 20, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 36);
    
    doc.setFontSize(12);
    let y = 50;
    
    doc.text(`Total Entradas: R$ ${entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
    y += 8;
    doc.text(`Total Saídas: R$ ${saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
    y += 8;
    doc.text(`Saldo Projetado: R$ ${saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, y);
    y += 15;
    
    doc.text('DETALHAMENTO POR DATA', 20, y);
    y += 10;
    
    fluxoOrdenado.forEach(item => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`${new Date(item.data).toLocaleDateString('pt-BR')}`, 20, y);
      doc.text(`Entradas: R$ ${item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, y);
      doc.text(`Saídas: R$ ${item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 110, y);
      doc.text(`Saldo: R$ ${item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, y);
      y += 6;
    });
    
    doc.save('fluxo-caixa.pdf');
    toast.success('Fluxo de Caixa exportado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Fluxo de Caixa Projetado
        </h2>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Próximos 7 dias</SelectItem>
              <SelectItem value="15">Próximos 15 dias</SelectItem>
              <SelectItem value="30">Próximos 30 dias</SelectItem>
              <SelectItem value="60">Próximos 60 dias</SelectItem>
              <SelectItem value="90">Próximos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Entradas Previstas</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{parcelasFuturas.length} parcela(s)</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Saídas Previstas</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">{despesasFuturas.length} despesa(s)</p>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Saldo Projetado</CardTitle>
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Próximos {periodo} dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Data */}
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fluxoOrdenado.length === 0 ? (
              <p className={`text-center py-8 ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                Nenhuma movimentação prevista para o período selecionado
              </p>
            ) : (
              fluxoOrdenado.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(item.data).toLocaleDateString('pt-BR', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Entradas</div>
                        <div className="font-semibold text-green-600">
                          +R$ {item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Saídas</div>
                        <div className="font-semibold text-red-600">
                          -R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Saldo</div>
                        <div className={`font-bold ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}