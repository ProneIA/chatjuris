import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, FileText, MapPin } from 'lucide-react';

export default function RadarDashboard({ insights, casosPublicos, theme }) {
  const isDark = theme === 'dark';

  const stats = React.useMemo(() => {
    const totalCasos = casosPublicos?.length || 0;
    const ticketMedio = insights?.reduce((acc, i) => acc + (i.ticket_medio || 0), 0) / (insights?.length || 1);
    const casosAlta = insights?.filter(i => i.tendencia === 'alta').length || 0;
    
    return {
      totalCasos,
      ticketMedio: Math.round(ticketMedio),
      casosAlta,
      insights: insights?.length || 0
    };
  }, [insights, casosPublicos]);

  const getTrendIcon = (tendencia) => {
    if (tendencia === 'alta') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (tendencia === 'queda') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Casos Identificados
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalCasos}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Ticket Médio
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  R$ {stats.ticketMedio.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Tendência Alta
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.casosAlta}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  Insights Gerados
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.insights}
                </p>
              </div>
              <MapPin className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Recentes */}
      <Card className={isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
            Insights Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights?.slice(0, 5).map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {insight.titulo}
                      </h3>
                      {getTrendIcon(insight.tendencia)}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                      {insight.area_juridica} • {insight.regiao}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {insight.volume_casos} casos
                  </Badge>
                </div>
                <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`}>
                  {insight.descricao}
                </p>
                {insight.ticket_medio > 0 && (
                  <p className={`text-sm mt-2 font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Ticket médio estimado: R$ {insight.ticket_medio.toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}