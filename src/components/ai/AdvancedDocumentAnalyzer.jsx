import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  X, 
  Loader2, 
  GitCompare, 
  AlertTriangle, 
  FileSearch,
  Scale,
  Sparkles,
  CheckCircle2
} from "lucide-react";

const analysisTypes = [
  {
    id: "compare",
    name: "Comparar Documentos",
    icon: GitCompare,
    description: "Compare dois documentos e identifique diferenças",
    color: "from-blue-500 to-cyan-500",
    requires2Files: true
  },
  {
    id: "inconsistencies",
    name: "Identificar Inconsistências",
    icon: AlertTriangle,
    description: "Encontre inconsistências e conflitos no contrato",
    color: "from-orange-500 to-red-500",
    requires2Files: false
  },
  {
    id: "extract_clauses",
    name: "Extrair Cláusulas",
    icon: FileSearch,
    description: "Extraia e classifique todas as cláusulas",
    color: "from-purple-500 to-pink-500",
    requires2Files: false
  },
  {
    id: "generate_opinion",
    name: "Gerar Parecer",
    icon: Scale,
    description: "Gere um parecer jurídico inicial do documento",
    color: "from-green-500 to-emerald-500",
    requires2Files: false
  }
];

export default function AdvancedDocumentAnalyzer({ 
  primaryFile, 
  onAnalyze, 
  onClose,
  isAnalyzing 
}) {
  const [selectedType, setSelectedType] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const secondaryFileInputRef = useRef(null);

  const handleSecondaryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSecondary(true);
    try {
      const { file_url } = await window.base44.integrations.Core.UploadFile({ file });
      setSecondaryFile({ url: file_url, name: file.name, type: file.type });
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do segundo arquivo.");
    }
    setUploadingSecondary(false);
  };

  const handleAnalyze = () => {
    if (!selectedType) return;
    
    const type = analysisTypes.find(t => t.id === selectedType);
    if (type.requires2Files && !secondaryFile) {
      alert("Este tipo de análise requer dois documentos.");
      return;
    }

    onAnalyze(selectedType, secondaryFile);
  };

  const selectedAnalysis = analysisTypes.find(t => t.id === selectedType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Análise Avançada de Documentos
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Escolha o tipo de análise que deseja realizar
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-red-100 dark:hover:bg-red-900"
        >
          <X className="w-5 h-5 text-red-600" />
        </Button>
      </div>

      {/* Primary File Display */}
      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-900 dark:text-green-200">
            Documento Principal:
          </span>
          <span className="text-sm text-green-700 dark:text-green-300 truncate">
            {primaryFile.name}
          </span>
          <Badge className="ml-auto bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
            Carregado
          </Badge>
        </div>
      </div>

      {/* Analysis Type Selection */}
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {analysisTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;

          return (
            <motion.button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? `bg-gradient-to-br ${type.color} border-transparent text-white`
                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-600"
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold mb-1 ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {type.name}
                  </h4>
                  <p className={`text-xs ${isSelected ? "text-white/90" : "text-slate-600 dark:text-slate-400"}`}>
                    {type.description}
                  </p>
                  {type.requires2Files && (
                    <Badge className="mt-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 text-xs">
                      Requer 2 arquivos
                    </Badge>
                  )}
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Secondary File Upload (for comparison) */}
      <AnimatePresence>
        {selectedAnalysis?.requires2Files && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            {!secondaryFile ? (
              <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4 text-center bg-blue-50 dark:bg-blue-900/20">
                <input
                  ref={secondaryFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleSecondaryUpload}
                />
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Faça upload do segundo documento
                </p>
                <Button
                  onClick={() => secondaryFileInputRef.current?.click()}
                  disabled={uploadingSecondary}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploadingSecondary ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Arquivo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Segundo Documento:
                  </span>
                  <span className="text-sm text-blue-700 dark:text-blue-300 truncate">
                    {secondaryFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSecondaryFile(null)}
                    className="ml-auto h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-800"
                  >
                    <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={!selectedType || isAnalyzing || (selectedAnalysis?.requires2Files && !secondaryFile)}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 font-semibold"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Iniciar Análise
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}