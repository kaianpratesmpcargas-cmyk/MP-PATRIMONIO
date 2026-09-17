import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, Zap } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'mp-camera-reader';

  // Som de bipe ao ler com sucesso
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Ignorar caso o navegador bloqueie áudio automático
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setIsStarting(true);
    setErrorMsg(null);

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar scanner:', err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const startScanner = async () => {
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText: string) => {
        playBeep();
        // Vibar caso disponível no smartphone
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        stopScanner().then(() => {
          onScanSuccess(decodedText);
          onClose();
        });
      };

      const qrErrorCallback = () => {
        // Ignora erros contínuos de quadros vazios
      };

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        qrErrorCallback
      );

      setIsStarting(false);

      // Checa suporte a lanterna
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if ((capabilities as any).torch) {
          setTorchSupported(true);
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.error('Erro ao inicializar câmera:', err);
      setIsStarting(false);
      setErrorMsg(
        err.message ||
          'Não foi possível acessar a câmera. Verifique as permissões do navegador.'
      );
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current && torchSupported) {
      try {
        const nextState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      } catch (err) {
        console.error('Erro ao alternar lanterna:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm no-print">
      <div className="bg-[#111111] text-white rounded-2xl w-full max-w-lg overflow-hidden border border-gray-800 shadow-2xl flex flex-col">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFD100] flex items-center justify-center text-black">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Bipar com Câmera</h3>
              <p className="text-xs text-gray-400">Aponte para o código Code 128</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-lg transition-colors ${
                  torchOn
                    ? 'bg-[#FFD100] text-black'
                    : 'bg-gray-800 text-gray-300 hover:text-white'
                }`}
                title="Lanterna"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área do Leitor de Câmera */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] overflow-hidden">
          <div id={readerElementId} className="w-full h-full max-w-md"></div>

          {isStarting && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3">
              <RefreshCw className="w-8 h-8 text-[#FFD100] animate-spin" />
              <p className="text-sm font-medium text-gray-300">Iniciando câmera...</p>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-950 text-center gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm font-semibold text-white">Acesso à Câmera</p>
              <p className="text-xs text-gray-400 max-w-xs">{errorMsg}</p>
              <button
                onClick={startScanner}
                className="mt-2 bg-[#FFD100] text-black text-xs font-bold py-2 px-4 rounded-lg hover:bg-[#E5BC00]"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Rodapé e Instruções */}
        <div className="p-4 bg-[#181818] border-t border-gray-800 text-center">
          <p className="text-xs text-gray-400">
            Mantenha o código de barras alinhado dentro do retângulo central.
          </p>
          <button
            onClick={onClose}
            className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
