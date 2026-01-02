import { useEffect } from 'react';

/**
 * Componente para rastrear o código de afiliado via URL
 * Deve ser incluído nas páginas de entrada (LandingPage, Pricing, etc)
 */
export default function AffiliateTracker() {
  useEffect(() => {
    // Verificar se há um parâmetro 'ref' na URL
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateCode = urlParams.get('ref');
    
    if (affiliateCode) {
      // Salvar no localStorage com expiração de 30 dias
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const affiliateData = {
        code: affiliateCode,
        expires: expirationDate.getTime()
      };
      
      localStorage.setItem('affiliate_ref', JSON.stringify(affiliateData));
      
      // Limpar o parâmetro da URL para deixar limpo
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return null; // Componente não renderiza nada
}

/**
 * Função auxiliar para recuperar o código de afiliado armazenado
 * Usar ao criar uma assinatura
 */
export function getStoredAffiliateCode() {
  try {
    const stored = localStorage.getItem('affiliate_ref');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Verificar se ainda está válido
    if (new Date().getTime() > data.expires) {
      localStorage.removeItem('affiliate_ref');
      return null;
    }
    
    return data.code;
  } catch (error) {
    return null;
  }
}

/**
 * Função para limpar o código de afiliado após conversão
 */
export function clearAffiliateCode() {
  localStorage.removeItem('affiliate_ref');
}