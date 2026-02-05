import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

export default function MapaRegional({ casosPublicos, theme }) {
  const isDark = theme === 'dark';

  const regionalData = React.useMemo(() => {
    const regioes = {};
    casosPublicos?.forEach((caso) => {
      const key = caso.estado || 'N/A';
      if (!regioes[key]) {
        regioes[key] = {
          estado: key,
          casos: 0,
          areas: new Set(),
          ticketTotal: 0
        };
      }
      regioes[key].casos += 1;
      regioes[key].areas.add(caso.area_juridica);
      regioes[key].ticketTotal += caso.valor_causa || 0;
    });

    return Object.values(regioes).map(r => ({
      ...r,
      areas: Array.from(r.areas),
      ticketMedio: Math.round(r.ticketTotal / r.casos)
    })).sort((a, b) => b.casos - a.casos);
  }, [casosPublicos]);

  const estadoNomes = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
    'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
    'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
    'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
    'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
  };

  return (
    <div className="space-y-6">
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Distribuição Regional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionalData.map((regiao) => (
              <div
                key={regiao.estado}
                className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {estadoNomes[regiao.estado] || regiao.estado}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {regiao.estado}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {regiao.casos} casos
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                    <span className="font-medium">Áreas predominantes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {regiao.areas.map((area) => (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {regiao.ticketMedio > 0 && (
                    <div className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      <span className="font-medium">Ticket médio:</span> R$ {regiao.ticketMedio.toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap visual simplificado */}
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Concentração de Casos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {regionalData.slice(0, 10).map((regiao, index) => {
              const maxCasos = regionalData[0]?.casos || 1;
              const percentage = (regiao.casos / maxCasos) * 100;
              
              return (
                <div key={regiao.estado} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isDark ? 'text-neutral-300' : 'text-gray-700'}>
                      {estadoNomes[regiao.estado] || regiao.estado}
                    </span>
                    <span className={isDark ? 'text-neutral-400' : 'text-gray-600'}>
                      {regiao.casos} casos
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}