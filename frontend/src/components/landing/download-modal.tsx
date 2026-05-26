import { X, Download, Monitor, FileCode } from "lucide-react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  if (!isOpen) return null;

  const triggerDownload = (filename: string) => {
    const element = document.createElement("a");
    const file = new Blob(["Noderift binary placeholder content"], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Download className="text-blue-500 h-5 w-5" />
          Download Noderift
        </h3>
        <p className="text-sm text-slate-400 mb-6">Select package to run workflows locally or self-host.</p>
        <div className="space-y-3">
          <button
            onClick={() => triggerDownload("noderift-macos-universal.dmg")}
            className="w-full flex items-center justify-between rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 p-4 transition-all hover:scale-[1.01] cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <Monitor className="text-slate-300 group-hover:text-white h-5 w-5" />
              <div>
                <div className="text-sm font-semibold text-white">macOS Client</div>
                <div className="text-xs text-slate-500">Apple Silicon & Intel DMG</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-500 group-hover:text-blue-400">Download</span>
          </button>

          <a
            href="/noderift-setup.bat"
            download="noderift-setup.bat"
            className="w-full flex items-center justify-between rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 p-4 transition-all hover:scale-[1.01] cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <Monitor className="text-slate-300 group-hover:text-white h-5 w-5" />
              <div>
                <div className="text-sm font-semibold text-white">Windows Local Setup</div>
                <div className="text-xs text-slate-500">Double-click bat script to run in Docker</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-500 group-hover:text-blue-400">Download</span>
          </a>

          <button
            onClick={() => triggerDownload("noderift-docker-compose.zip")}
            className="w-full flex items-center justify-between rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 p-4 transition-all hover:scale-[1.01] cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <FileCode className="text-slate-300 group-hover:text-white h-5 w-5" />
              <div>
                <div className="text-sm font-semibold text-white">Docker Compose Template</div>
                <div className="text-xs text-slate-500">Zip file containing configuration</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-500 group-hover:text-blue-400">Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
