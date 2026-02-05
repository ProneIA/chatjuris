import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TendenciasChart({ insights, theme }) {
  const isDark = theme === 'dark';

  const chartData = React.useMemo(() => {
    const areaCount = {};
    insights?.forEach((insight) => {
      const area = insight.area_juridica;
      if (!areaCount[area]) {
        areaCount[area] = { area, casos: 0, ticket: 0, count: 0 };
      }
      areaCount[area].casos += insight.volume_casos || 0;
      areaCount[area].ticket += insight.ticket_medio || 0;
      areaCount[area].count += 1;
    });

    return Object.values(areaCount).map(item => ({
      ...item,
      ticketMedio: Math.round(item.ticket / item.count)
    }));
  }, [insights]);

  const areaLabels = {
    consumidor: 'Consumidor',
    trabalhista: 'Trabalhista',
    previdenciario: 'Previdenciário',
    familia: 'Família',
    empresarial: 'Empresarial',
    tributario: 'Tributário',
    saude: 'Saúde',
    imobiliario: 'Imobiliário'
  };

  return (
    <div className="space-y-6">
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Volume por Área Jurídica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
              <XAxis 
                dataKey="area" 
                stroke={isDark ? '#999' : '#666'}
                tickFormatter={(value) => areaLabels[value] || value}
              />
              <YAxis stroke={isDark ? '#999' : '#666'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f1f1f' : '#fff',
                  border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="casos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Ranking por Ticket Médio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData
              .sort((a, b) => b.ticketMedio - a.ticketMedio)
              .map((item, index) => (
                <div
                  key={item.area}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDark ? 'bg-neutral-800' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {areaLabels[item.area]}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                        {item.casos} casos identificados
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    R$ {item.ticketMedio.toLocaleString('pt-BR')}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}