import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, ExternalLink } from "lucide-react";

const regulamentoContent = `
# REGULAMENTO DE ASSINATURAS – JURIS

## 1. DISPOSIÇÕES GERAIS

1.1. O Juris é uma plataforma de inteligência artificial voltada ao apoio jurídico, disponibilizada mediante assinatura paga, conforme os planos descritos neste regulamento.

1.2. Ao contratar qualquer plano, o usuário declara ter lido, compreendido e concordado integralmente com este regulamento.

---

## 2. PLANOS DISPONÍVEIS

### 🔹 Plano Mensal
- **Valor:** R$ 119,90 (cento e dezenove reais e noventa centavos)
- **Periodicidade:** mensal
- **Cobrança:** recorrente, a cada 30 dias
- **Renovação:** automática, até cancelamento pelo usuário

### 🔹 Plano Anual
- **Valor:** R$ 99,90 (noventa e nove reais e noventa centavos) por mês
- **Total anual:** R$ 1.198,80 (mil cento e noventa e oito reais e oitenta centavos)
- **Cobrança:** única, no ato da contratação
- **Vigência:** 12 (doze) meses, contados a partir da confirmação do pagamento

> O valor mensal informado no plano anual é meramente ilustrativo, sendo a cobrança realizada em parcela única anual.

---

## 3. CUPONS DE DESCONTO

3.1. O Juris poderá disponibilizar cupons promocionais, por tempo limitado e sob condições específicas.

3.2. Os cupons:
- Não são cumulativos
- Devem ser aplicados no momento da contratação
- Não geram crédito ou reembolso posterior
- Podem ser suspensos ou cancelados a qualquer momento, sem aviso prévio

---

## 4. PAGAMENTOS

4.1. Os pagamentos são processados por meio do Mercado Pago, conforme as regras da plataforma de pagamento.

4.2. O Juris não se responsabiliza por recusas decorrentes de:
- Limite do cartão
- Análise antifraude
- Dados incorretos informados pelo usuário

4.3. O valor enviado para cobrança poderá incluir descontos promocionais válidos, não havendo qualquer irregularidade na cobrança com valor reduzido.

---

## 5. CANCELAMENTO E REEMBOLSO

### Plano Mensal

5.1. O usuário poderá cancelar a assinatura a qualquer momento.

5.2. O cancelamento interrompe futuras cobranças, não havendo reembolso proporcional do período já utilizado.

### Plano Anual

5.3. O plano anual possui cobrança única antecipada.

5.4. Após o início da vigência, não haverá reembolso total ou parcial, salvo disposição legal obrigatória.

---

## 6. ACESSO À PLATAFORMA

6.1. O acesso ao Juris é pessoal e intransferível.

6.2. O compartilhamento de conta poderá resultar em suspensão ou cancelamento da assinatura, sem direito a reembolso.

---

## 7. ALTERAÇÕES NO REGULAMENTO

7.1. O Juris se reserva o direito de alterar este regulamento, valores ou condições comerciais a qualquer tempo.

7.2. Alterações não afetam assinaturas já contratadas durante o período vigente.

---

## 8. DISPOSIÇÕES FINAIS

8.1. O uso da plataforma não substitui a atuação profissional de advogado regularmente inscrito na OAB.

8.2. O Juris não se responsabiliza por decisões tomadas com base exclusiva nas informações fornecidas pela plataforma.

---

📌 **Última atualização:** Janeiro/2026
`;

export function RegulationDialog({ children }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Regulamento de Assinaturas
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none">
            {regulamentoContent.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold mb-4 text-gray-900">{line.replace('# ', '')}</h1>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-800">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={index} className="text-base font-semibold mt-4 mb-2 text-gray-700">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('> ')) {
                return <blockquote key={index} className="border-l-4 border-amber-500 pl-4 italic text-gray-600 my-3">{line.replace('> ', '')}</blockquote>;
              }
              if (line.startsWith('- **')) {
                const parts = line.replace('- **', '').split(':**');
                return (
                  <p key={index} className="ml-4 my-1">
                    <strong>{parts[0]}:</strong>{parts[1]}
                  </p>
                );
              }
              if (line.startsWith('- ')) {
                return <li key={index} className="ml-6 my-1 text-gray-700">{line.replace('- ', '')}</li>;
              }
              if (line.startsWith('---')) {
                return <hr key={index} className="my-4 border-gray-200" />;
              }
              if (line.startsWith('📌')) {
                return <p key={index} className="mt-6 text-sm text-gray-500 font-medium">{line}</p>;
              }
              if (line.trim() === '') {
                return null;
              }
              return <p key={index} className="my-2 text-gray-700">{line}</p>;
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function SubscriptionRegulation({ accepted, onAcceptChange, isDark = false }) {
  return (
    <div className={`p-4 rounded-lg border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          id="regulation-accept"
          checked={accepted}
          onCheckedChange={onAcceptChange}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label 
            htmlFor="regulation-accept" 
            className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Li e concordo com o{' '}
            <RegulationDialog>
              <button 
                type="button"
                className="text-purple-600 hover:text-purple-700 font-medium underline inline-flex items-center gap-1"
              >
                Regulamento de Assinaturas
                <ExternalLink className="w-3 h-3" />
              </button>
            </RegulationDialog>
            {' '}do Juris, incluindo as políticas de pagamento, cancelamento e reembolso.
          </Label>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            O plano anual é cobrado em parcela única de R$ 1.198,80. O plano mensal é renovado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}