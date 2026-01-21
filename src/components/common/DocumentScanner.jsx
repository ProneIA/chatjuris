import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Scan, Loader2, CheckCircle2, XCircle, FileImage } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function DocumentScanner({ onDataExtracted, documentType = "identity", isDark = false }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const documentSchemas = {
    identity: {
      type: "object",
      properties: {
        nome_completo: { type: "string", description: "Nome completo da pessoa exatamente como aparece no documento" },
        cpf: { type: "string", description: "Número do CPF - apenas números, sem pontos ou traços" },
        rg: { type: "string", description: "Número do RG completo" },
        data_nascimento: { type: "string", description: "Data de nascimento no formato DD/MM/AAAA" },
        nome_mae: { type: "string", description: "Nome completo da mãe" },
        nome_pai: { type: "string", description: "Nome completo do pai (se disponível)" },
        orgao_emissor: { type: "string", description: "Órgão emissor do documento (ex: SSP/SP)" },
        naturalidade: { type: "string", description: "Cidade e estado de nascimento (se disponível)" },
        endereco: { type: "string", description: "Endereço completo se constar no documento" }
      }
    },
    cnh: {
      type: "object",
      properties: {
        nome_completo: { type: "string", description: "Nome completo do condutor" },
        cpf: { type: "string", description: "Número do CPF" },
        numero_cnh: { type: "string", description: "Número da CNH" },
        data_nascimento: { type: "string", description: "Data de nascimento" },
        categoria: { type: "string", description: "Categoria da CNH" },
        data_validade: { type: "string", description: "Data de validade da CNH" }
      }
    },
    cnpj: {
      type: "object",
      properties: {
        razao_social: { type: "string", description: "Razão social completa da empresa" },
        cnpj: { type: "string", description: "Número do CNPJ - apenas números, sem pontos, traços ou barras" },
        nome_fantasia: { type: "string", description: "Nome fantasia da empresa (se disponível)" },
        endereco: { type: "string", description: "Endereço completo: rua, número, complemento, bairro, cidade, estado, CEP" },
        data_abertura: { type: "string", description: "Data de abertura/constituição no formato DD/MM/AAAA (se disponível)" },
        natureza_juridica: { type: "string", description: "Natureza jurídica (se disponível)" },
        capital_social: { type: "string", description: "Capital social (se disponível)" }
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato não suportado. Use JPG, PNG ou PDF.");
        return;
      }

      setImage(file);
      setError(null);
      setExtractedData(null);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanDocument = async () => {
    if (!image) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Upload da imagem
      toast.info("Enviando imagem...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: image });

      // 2. Extração de dados com IA usando LLM diretamente
      toast.info("Extraindo dados do documento com IA...");
      
      const documentTypeInstructions = {
        identity: "Extraia os seguintes dados do documento de identidade (RG, CNH ou similar): nome completo, CPF (apenas números), RG, data de nascimento (formato DD/MM/AAAA), nome da mãe, e órgão emissor.",
        cnh: "Extraia os seguintes dados da CNH: nome completo, CPF, número da CNH, data de nascimento, categoria da CNH, e data de validade.",
        cnpj: "Extraia os seguintes dados do cartão CNPJ: razão social, CNPJ (apenas números), nome fantasia, e endereço completo."
      };

      const schema = documentSchemas[documentType];
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em OCR e extração de dados de documentos brasileiros.

${documentTypeInstructions[documentType]}

INSTRUÇÕES CRÍTICAS:
- Analise CUIDADOSAMENTE o documento fornecido (pode ser PDF ou imagem)
- Extraia TODOS os dados visíveis e legíveis que correspondam aos campos solicitados
- Para CPF e CNPJ: retorne APENAS números, sem pontos, traços ou barras (ex: "12345678900")
- Para datas: use sempre o formato DD/MM/AAAA (ex: "01/01/1990")
- Para nomes: capture o nome completo exatamente como aparece no documento
- Para endereços: inclua rua, número, complemento, bairro, cidade e estado
- Se um campo não estiver visível ou legível, NÃO o inclua no JSON de resposta
- NÃO invente ou deduza dados que não estão claramente escritos no documento
- Seja extremamente preciso na transcrição dos textos

ATENÇÃO: Este é um documento legal importante. A precisão é ESSENCIAL.

Analise o documento anexado e retorne os dados no formato JSON solicitado.`,
        file_urls: [file_url],
        response_json_schema: schema
      });

      if (response && typeof response === 'object') {
        // Limpar dados vazios
        const cleanedData = Object.fromEntries(
          Object.entries(response).filter(([_, v]) => v && v.toString().trim() !== '')
        );

        if (Object.keys(cleanedData).length > 0) {
          setExtractedData(cleanedData);
          toast.success("Dados extraídos com sucesso!");
          
          // Callback para componente pai
          if (onDataExtracted) {
            onDataExtracted(cleanedData);
          }
        } else {
          throw new Error("Nenhum dado foi extraído do documento");
        }
      } else {
        throw new Error("Resposta inválida da IA");
      }
    } catch (err) {
      const errorMsg = err.message || "Erro ao processar documento";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImagePreview(null);
    setExtractedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const documentTypeLabels = {
    identity: "Identidade (RG/CNH)",
    cnh: "CNH",
    cnpj: "Cartão CNPJ"
  };

  return (
    <Card className={isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-gray-200"}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
          <Scan className="w-4 h-4" />
          Scanner de {documentTypeLabels[documentType]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload/Camera */}
        {!imagePreview && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Galeria
              </Button>
            </div>
            
            <div>
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-capture"
              />
              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Câmera
              </Button>
            </div>
          </div>
        )}

        {/* Preview da Imagem */}
        <AnimatePresence mode="wait">
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <div className={`relative rounded-lg overflow-hidden border ${isDark ? "border-neutral-700" : "border-gray-300"}`}>
                {image?.type === 'application/pdf' ? (
                  <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100">
                    <FileImage className="w-16 h-16 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">{image.name}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF carregado - pronto para escanear</p>
                  </div>
                ) : (
                  <img 
                    src={imagePreview} 
                    alt="Documento" 
                    className="w-full h-auto max-h-64 object-contain bg-gray-100"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <Button
                    onClick={reset}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!extractedData && !processing && !error && (
                <Button
                  onClick={scanDocument}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  Escanear e Extrair Dados
                </Button>
              )}

              {processing && (
                <div className="flex items-center justify-center gap-2 py-4 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Processando documento...</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dados Extraídos */}
        <AnimatePresence>
          {extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Dados Extraídos
                </span>
              </div>
              <div className="space-y-2">
                {Object.entries(extractedData).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex justify-between text-sm">
                      <span className={isDark ? "text-neutral-400" : "text-gray-600"}>
                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:
                      </span>
                      <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                        {value}
                      </span>
                    </div>
                  )
                ))}
              </div>
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="w-full mt-3"
              >
                Escanear Outro Documento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erro */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-lg border ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}
          >
            <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
              {error}
            </p>
          </motion.div>
        )}

        {/* Dica */}
        {!imagePreview && (
          <div className={`text-xs ${isDark ? "text-neutral-500" : "text-gray-500"} text-center space-y-1`}>
            <p>💡 Aceita: Fotos (JPG, PNG) ou PDFs</p>
            <p className="text-[10px]">Tire uma foto clara ou selecione um arquivo da galeria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}